/**
 * AUTO RESOLVE — checks Pyth prices and resolves price-based markets on-chain.
 *
 * Run manually:  node auto-resolve.cjs
 * Run via cron:  GitHub Actions (see .github/workflows/auto-resolve.yml)
 *
 * Markets resolved by this script:
 *   1  — BTC > $100k  → YES
 *   2  — SOL > $500   → YES
 *   3  — BTC > $150k  → YES
 *   6  — ETH > $10k   → YES
 *   7  — SOL flips ETH TVL → skip (manual)
 *   9  — Gold > $3500 → YES
 *  16  — XRP > $10    → YES
 *  17  — DOGE > $1    → YES
 *  24  — Tesla > $500 → skip (no Pyth feed)
 */
const path = require('path');
const NM = '/Users/syedhassan/Desktop/Oracle Token/files/node_modules';
const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } = require(path.join(NM, '@solana/web3.js'));
const fs = require('fs');
const os = require('os');
const https = require('https');

const PROGRAM_ID = new PublicKey('HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj');
const RPC        = 'https://devnet.helius-rpc.com/?api-key=bb6da2ff-6316-4784-9ef8-53de07864e95';
const connection = new Connection(RPC, 'confirmed');

// Load admin keypair
let payer;
if (process.env.SOLANA_KEYPAIR_JSON) {
  payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_KEYPAIR_JSON)));
} else {
  const secret = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/solana/id.json'), 'utf8'));
  payer = Keypair.fromSecretKey(Uint8Array.from(secret));
}
console.log('Admin wallet:', payer.publicKey.toBase58());

// ─── Market resolve rules ─────────────────────────────────────────────────────
// pythKey: key in PYTH_FEEDS, condition: fn(price) -> bool, yesOption: 0, noOption: 1
const MARKET_ADDRESSES = {
  '1':  '5ZHfybcV5sSf7uZ6PemM2pychytL6wbXmdnwaiWbbMPp',
  '2':  'CuvChQETTNKYcnDNJwTQccQkQwJpuK8tqv3KWfwB7Jd2',
  '3':  '3YpbeWS4cRgSJacfu9GunkY1MFB7TjTaZp8FbGyU13hT',
  '6':  'HHB7hUByh8YxJhH8DcqS5uSjHAZEgJfRqVu6YMeVtfyE',
  '9':  'ByfnE38LZar9cM3GNAXuqhPdWjY8VqhAMZtToLKgNUA6',
  '16': '5KKVfWFmPNEfhZ2iSUHwp6DeVtWonyAYzLswPnF2dnfE',
  '17': 'GEXcEvSZb2BndVUFABoAxxEE9CFSyCPFwVj383mBzYgX',
};

const RESOLVE_RULES = [
  { id: 1,  pythKey: 'btc',  label: 'BTC > $100k',  condition: p => p >= 100000, winOption: 0 },
  { id: 2,  pythKey: 'sol',  label: 'SOL > $500',   condition: p => p >= 500,    winOption: 0 },
  { id: 3,  pythKey: 'btc',  label: 'BTC > $150k',  condition: p => p >= 150000, winOption: 0 },
  { id: 6,  pythKey: 'eth',  label: 'ETH > $10k',   condition: p => p >= 10000,  winOption: 0 },
  { id: 9,  pythKey: 'gold', label: 'Gold > $3500', condition: p => p >= 3500,   winOption: 0 },
  { id: 16, pythKey: 'xrp',  label: 'XRP > $10',    condition: p => p >= 10,     winOption: 0 },
  { id: 17, pythKey: 'doge', label: 'DOGE > $1',    condition: p => p >= 1,      winOption: 0 },
];

// Pyth Hermes feed IDs
const PYTH_FEED_IDS = {
  btc:  'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  sol:  'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  eth:  'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  gold: '765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
  xrp:  'ec5d399b169a74b5e30fc7de30abb26cbabb50c4d3e79e35b4c5adb0acf96f5b',
  doge: 'dcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'OracleToken/1.0' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('JSON parse failed: ' + data.slice(0, 100))); }
      });
    }).on('error', reject);
  });
}

async function fetchPythPrices() {
  const ids = Object.values(PYTH_FEED_IDS);
  const url = `https://hermes.pyth.network/v2/updates/price/latest?${ids.map(id => `ids[]=${id}`).join('&')}`;
  const data = await fetchJson(url);
  const prices = {};
  for (const item of (data.parsed || [])) {
    const entry = Object.entries(PYTH_FEED_IDS).find(([, id]) => id === item.id);
    if (!entry) continue;
    prices[entry[0]] = parseFloat(item.price.price) * Math.pow(10, item.price.expo);
  }
  return prices;
}

// ─── PDA helpers ─────────────────────────────────────────────────────────────
function marketPDA(id) {
  const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(id), 0);
  return PublicKey.findProgramAddressSync([Buffer.from('market'), b.slice(0, 6)], PROGRAM_ID);
}
function profilePDA(w) { return PublicKey.findProgramAddressSync([Buffer.from('profile'), w.toBuffer()], PROGRAM_ID); }
function platformPDA() { return PublicKey.findProgramAddressSync([Buffer.from('platform')], PROGRAM_ID); }

// ─── Borsh helper ────────────────────────────────────────────────────────────
function parseMarketStatus(data) {
  try {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const dec = new TextDecoder();
    let o = 8;   // discriminator
    o += 8;      // market_id
    o += 32;     // creator
    const titleLen = view.getUint32(o, true); o += 4 + titleLen;
    const descLen = view.getUint32(o, true); o += 4 + descLen;
    o += 1;      // category
    const numOpts = view.getUint32(o, true); o += 4;
    for (let i = 0; i < numOpts; i++) { const l = view.getUint32(o, true); o += 4 + l; }
    const numVotes = view.getUint32(o, true); o += 4 + numVotes * 8;
    o += 8;      // resolution_timestamp
    const status = view.getUint8(o); // 0=Pending, 1=Active, 2=Resolved
    return status;
  } catch { return -1; }
}

async function resolveMarket(id, winOption) {
  const [mPda] = marketPDA(id);
  const [profPda] = profilePDA(payer.publicKey);
  const [platPda] = platformPDA();

  const buf = Buffer.alloc(9);
  Buffer.from([95, 0, 240, 167, 32, 165, 176, 233]).copy(buf, 0); // admin_resolve_market discriminator
  buf.writeUInt8(winOption, 8);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: mPda,              isSigner: false, isWritable: true },
      { pubkey: profPda,           isSigner: false, isWritable: true },
      { pubkey: platPda,           isSigner: false, isWritable: true },
      { pubkey: payer.publicKey,   isSigner: true,  isWritable: true },
    ],
    data: buf,
  });

  const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [payer]);
  return sig;
}

async function main() {
  console.log('\nFetching Pyth prices...');
  const prices = await fetchPythPrices();
  console.log('Prices:', Object.entries(prices).map(([k, v]) => `${k.toUpperCase()}=$${v.toLocaleString(undefined, { maximumFractionDigits: 4 })}`).join(', '));

  let resolved = 0;
  for (const rule of RESOLVE_RULES) {
    const price = prices[rule.pythKey];
    if (price === undefined) { console.log(`  ${rule.label}: no price data, skipping`); continue; }

    const conditionMet = rule.condition(price);
    console.log(`\nMarket ${rule.id} — ${rule.label}: price=${price.toFixed(4)}, condition=${conditionMet ? 'MET ✓' : 'not met'}`);

    if (!conditionMet) continue;

    // Check if market is already resolved
    const addr = MARKET_ADDRESSES[String(rule.id)];
    if (!addr) { console.log(`  No address found for market ${rule.id}, skipping`); continue; }
    const info = await connection.getAccountInfo(new PublicKey(addr));
    if (!info) { console.log(`  Market ${rule.id} account not found, skipping`); continue; }
    const status = parseMarketStatus(info.data);
    if (status === 2) { console.log(`  Already resolved, skipping`); continue; }
    if (status !== 1) { console.log(`  Market not active (status=${status}), skipping`); continue; }

    console.log(`  Resolving market ${rule.id} with option ${rule.winOption} (YES)...`);
    try {
      const sig = await resolveMarket(rule.id, rule.winOption);
      console.log(`  ✓ Resolved! Tx: ${sig}`);
      resolved++;
    } catch(e) {
      console.error(`  ✗ Failed: ${e.message}`);
    }
  }

  console.log(`\nDone. ${resolved} market(s) resolved.`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
