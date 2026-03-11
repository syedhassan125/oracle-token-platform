/**
 * CI version of auto-resolve — uses local node_modules (installed by GitHub Actions).
 * Reads keypair from SOLANA_KEYPAIR_JSON env var.
 */
const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } = require('@solana/web3.js');
const https = require('https');
const http = require('http');

const PROGRAM_ID = new PublicKey('HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj');
const RPC        = 'https://devnet.helius-rpc.com/?api-key=bb6da2ff-6316-4784-9ef8-53de07864e95';
const connection = new Connection(RPC, 'confirmed');

const secret = JSON.parse(process.env.SOLANA_KEYPAIR_JSON);
const payer = Keypair.fromSecretKey(Uint8Array.from(secret));
console.log('Admin wallet:', payer.publicKey.toBase58());

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

const PYTH_FEED_IDS = {
  btc:  'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  sol:  'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  eth:  'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  gold: '765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
  xrp:  'ec5d399b169a74b5e30fc7de30abb26cbabb50c4d3e79e35b4c5adb0acf96f5b',
  doge: 'dcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
};

function fetchJson(url, redirectCount = 0) {
  if (redirectCount > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'OracleToken/1.0', 'Accept': 'application/json' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`)));
        return;
      }
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          console.error('Raw response (first 500 chars):', data.slice(0, 500));
          reject(new Error('JSON parse failed'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

async function fetchPythPrices() {
  const ids = Object.values(PYTH_FEED_IDS);
  const url = `https://hermes.pyth.network/v2/updates/price/latest?${ids.map(id => `ids[]=${id}`).join('&')}`;
  console.log('Fetching Pyth URL:', url.slice(0, 120) + '...');
  const data = await fetchJson(url);
  const prices = {};
  for (const item of (data.parsed || [])) {
    const entry = Object.entries(PYTH_FEED_IDS).find(([, id]) => id === item.id);
    if (!entry) continue;
    prices[entry[0]] = parseFloat(item.price.price) * Math.pow(10, item.price.expo);
  }
  return prices;
}

function marketPDA(id) {
  const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(id), 0);
  return PublicKey.findProgramAddressSync([Buffer.from('market'), b.slice(0, 6)], PROGRAM_ID);
}
function profilePDA(w) { return PublicKey.findProgramAddressSync([Buffer.from('profile'), w.toBuffer()], PROGRAM_ID); }
function platformPDA() { return PublicKey.findProgramAddressSync([Buffer.from('platform')], PROGRAM_ID); }

function parseMarketStatus(data) {
  try {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let o = 8 + 8 + 32;
    const titleLen = view.getUint32(o, true); o += 4 + titleLen;
    const descLen = view.getUint32(o, true); o += 4 + descLen;
    o += 1;
    const numOpts = view.getUint32(o, true); o += 4;
    for (let i = 0; i < numOpts; i++) { const l = view.getUint32(o, true); o += 4 + l; }
    const numVotes = view.getUint32(o, true); o += 4 + numVotes * 8;
    o += 8;
    return view.getUint8(o);
  } catch { return -1; }
}

async function resolveMarket(id, winOption) {
  const [mPda] = marketPDA(id);
  const [profPda] = profilePDA(payer.publicKey);
  const [platPda] = platformPDA();
  const buf = Buffer.alloc(9);
  Buffer.from([95, 0, 240, 167, 32, 165, 176, 233]).copy(buf, 0);
  buf.writeUInt8(winOption, 8);
  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: mPda,            isSigner: false, isWritable: true },
      { pubkey: profPda,         isSigner: false, isWritable: true },
      { pubkey: platPda,         isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true,  isWritable: true },
    ],
    data: buf,
  });
  return sendAndConfirmTransaction(connection, new Transaction().add(ix), [payer]);
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
    console.log(`Market ${rule.id} — ${rule.label}: $${price.toFixed(2)} → ${conditionMet ? 'RESOLVE ✓' : 'not yet'}`);
    if (!conditionMet) continue;

    const addr = MARKET_ADDRESSES[String(rule.id)];
    if (!addr) continue;
    const info = await connection.getAccountInfo(new PublicKey(addr));
    if (!info) { console.log(`  Account not found`); continue; }
    const status = parseMarketStatus(info.data);
    if (status === 2) { console.log(`  Already resolved`); continue; }
    if (status !== 1) { console.log(`  Not active (status=${status})`); continue; }

    console.log(`  Resolving market ${rule.id}...`);
    try {
      const sig = await resolveMarket(rule.id, rule.winOption);
      console.log(`  ✓ ${sig}`);
      resolved++;
    } catch(e) {
      console.error(`  ✗ ${e.message}`);
    }
  }
  console.log(`\nDone. ${resolved} resolved.`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
