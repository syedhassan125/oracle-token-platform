/**
 * CI version of auto-sports-markets — uses local node_modules (installed by GitHub Actions).
 * Reads keypair from SOLANA_KEYPAIR_JSON env var.
 */
const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
const fs = require('fs');
const os = require('os');
const https = require('https');

const PROGRAM_ID = new PublicKey('HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj');
const OCT_MINT   = new PublicKey('6SnhG4g4icbJ2i9U97zEtxkSc6dZ5Z8sCSTtSJH2QuqA');
const RPC        = 'https://devnet.helius-rpc.com/?api-key=bb6da2ff-6316-4784-9ef8-53de07864e95';
const connection = new Connection(RPC, 'confirmed');

const secret = JSON.parse(process.env.SOLANA_KEYPAIR_JSON);
const payer = Keypair.fromSecretKey(Uint8Array.from(secret));
console.log('Admin wallet:', payer.publicKey.toBase58());

const ID_FILE = '/tmp/.oracle-market-counter.json';
function nextMarketId() {
  let counter = 100;
  if (fs.existsSync(ID_FILE)) {
    try { counter = JSON.parse(fs.readFileSync(ID_FILE, 'utf8')).next; } catch {}
  }
  fs.writeFileSync(ID_FILE, JSON.stringify({ next: counter + 1 }));
  return counter;
}

const LEAGUES = [
  { id: 4328, name: 'English Premier League', cat: 0 },
  { id: 4335, name: 'La Liga',                cat: 0 },
  { id: 4387, name: 'NBA',                    cat: 0 },
  { id: 4341, name: 'IPL Cricket',            cat: 0 },
  { id: 4480, name: 'UEFA Champions League',  cat: 0 },
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'OracleToken/1.0' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('JSON parse failed')); } });
    }).on('error', reject);
  });
}

async function fetchUpcomingFixtures(leagueId) {
  const url = `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`;
  try {
    const data = await fetchJson(url);
    return (data.events || []).slice(0, 3);
  } catch(e) {
    console.warn(`  Failed league ${leagueId}: ${e.message}`);
    return [];
  }
}

function fixtureToMarket(event, cat) {
  const home = event.strHomeTeam;
  const away = event.strAwayTeam;
  const league = event.strLeague;
  const dateStr = event.dateEvent;
  const resolution = Math.floor(new Date(dateStr + 'T23:59:00Z').getTime() / 1000) + 60 * 60 * 48;
  if (resolution <= Math.floor(Date.now() / 1000) + 3600) return null;
  return {
    title: `Will ${home} beat ${away}? (${league})`,
    desc: `${home} vs ${away} — ${dateStr}`,
    cat, options: ['Yes (Home Win)', 'No (Draw/Away)'], res: resolution,
  };
}

function writeU8(b,o,v)  { b.writeUInt8(v,o); return o+1; }
function writeU32(b,o,v) { b.writeUInt32LE(v,o); return o+4; }
function writeU64(b,o,v) { b.writeBigUInt64LE(BigInt(v),o); return o+8; }
function writeI64(b,o,v) { b.writeBigInt64LE(BigInt(v),o); return o+8; }
function writeString(b,o,s) { const bytes = Buffer.from(s,'utf8'); o=writeU32(b,o,bytes.length); bytes.copy(b,o); return o+bytes.length; }
function writeVecStrings(b,o,arr) { o=writeU32(b,o,arr.length); for(const s of arr) o=writeString(b,o,s); return o; }

function marketPDA(id) {
  const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(id), 0);
  return PublicKey.findProgramAddressSync([Buffer.from('market'), b.slice(0, 6)], PROGRAM_ID);
}
function profilePDA(w) { return PublicKey.findProgramAddressSync([Buffer.from('profile'), w.toBuffer()], PROGRAM_ID); }
function platformPDA() { return PublicKey.findProgramAddressSync([Buffer.from('platform')], PROGRAM_ID); }

async function createMarket(id, m) {
  const [mPda] = marketPDA(id);
  if (await connection.getAccountInfo(mPda)) { console.log(`  Market ${id} exists, skipping`); return mPda; }
  const [profPda] = profilePDA(payer.publicKey);
  const [platPda] = platformPDA();
  const buf = Buffer.alloc(2048);
  let o = 0;
  Buffer.from([103,226,97,235,200,188,251,254]).copy(buf,o); o+=8;
  o=writeU64(buf,o,id); o=writeString(buf,o,m.title); o=writeString(buf,o,m.desc);
  o=writeU8(buf,o,m.cat); o=writeI64(buf,o,m.res); o=writeVecStrings(buf,o,m.options);
  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: mPda,                    isSigner:false, isWritable:true },
      { pubkey: profPda,                 isSigner:false, isWritable:true },
      { pubkey: platPda,                 isSigner:false, isWritable:true },
      { pubkey: payer.publicKey,         isSigner:true,  isWritable:true },
      { pubkey: SystemProgram.programId, isSigner:false, isWritable:false },
    ],
    data: buf.slice(0,o),
  });
  await sendAndConfirmTransaction(connection, new Transaction().add(ix), [payer]);
  const vault = await splToken.getAssociatedTokenAddress(OCT_MINT, mPda, true);
  if (!await connection.getAccountInfo(vault)) {
    const vaultIx = splToken.createAssociatedTokenAccountInstruction(
      payer.publicKey, vault, mPda, OCT_MINT,
      splToken.TOKEN_PROGRAM_ID, splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );
    await sendAndConfirmTransaction(connection, new Transaction().add(vaultIx), [payer]);
  }
  console.log(`  ✓ Market ${id}: "${m.title}" → ${mPda.toBase58()}`);
  return mPda;
}

async function main() {
  const created = [];
  for (const league of LEAGUES) {
    console.log(`\nFetching ${league.name}...`);
    const events = await fetchUpcomingFixtures(league.id);
    for (const event of events) {
      const m = fixtureToMarket(event, league.cat);
      if (!m) { console.log(`  Skipping past event: ${event.strEvent}`); continue; }
      const id = nextMarketId();
      console.log(`  Creating market ${id}: ${m.title}`);
      try {
        const mPda = await createMarket(id, m);
        created.push({ id, addr: mPda.toBase58(), title: m.title });
      } catch(e) {
        console.error(`  Failed: ${e.message}`);
      }
    }
  }
  console.log(`\nTotal created: ${created.length}`);
  for (const { id, addr, title } of created) {
    console.log(`  '${id}': '${addr}',  // ${title}`);
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
