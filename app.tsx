import React, { FC, useMemo, useState, useEffect, useCallback } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import '@solana/wallet-adapter-react-ui/styles.css';

const PROGRAM_ID = new PublicKey("HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj");
const ORACLE_TOKEN_MINT = new PublicKey("6SnhG4g4icbJ2i9U97zEtxkSc6dZ5Z8sCSTtSJH2QuqA");
const HELIUS_RPC = 'https://devnet.helius-rpc.com/?api-key=bb6da2ff-6316-4784-9ef8-53de07864e95';

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Crypto', 'Politics', 'AI', 'Sports', 'Finance'];

const MARKETS = [
  { id: 1, question: "Will Ethereum ETF be approved?", category: "Crypto", yesPercent: 78, volume: "$3.2M", volumeNum: 3200000, ends: "220d", participants: 4312, emoji: "⟠", gradient: "linear-gradient(135deg,#1a1a4e,#2d1b69,#1a0a3e)" },
  { id: 2, question: "Trump to win 2028 Election?", category: "Politics", yesPercent: 45, volume: "$5.1M", volumeNum: 5100000, ends: "680d", participants: 8901, emoji: "🗳️", gradient: "linear-gradient(135deg,#1a0a0a,#3d0a1e,#1a0a2e)" },
  { id: 3, question: "BTC to hit $150k by 2026?", category: "Crypto", yesPercent: 61, volume: "$4.8M", volumeNum: 4800000, ends: "290d", participants: 6234, emoji: "₿", gradient: "linear-gradient(135deg,#0a1a1a,#0a2d3d,#1a0a3e)" },
  { id: 4, question: "Will Solana hit $500 in 2026?", category: "Crypto", yesPercent: 68, volume: "$1.2M", volumeNum: 1200000, ends: "220d", participants: 2341, emoji: "◎", gradient: "linear-gradient(135deg,#0a1a2e,#1a2d4e,#0a1a3e)" },
  { id: 5, question: "Is NASA going back to the Moon?", category: "Science", yesPercent: 55, volume: "$890K", volumeNum: 890000, ends: "180d", participants: 1892, emoji: "🌙", gradient: "linear-gradient(135deg,#0a0a2e,#1a1a4e,#0a1a3e)" },
  { id: 6, question: "Will AI pass the Turing Test?", category: "AI", yesPercent: 71, volume: "$2.1M", volumeNum: 2100000, ends: "75d", participants: 3102, emoji: "🤖", gradient: "linear-gradient(135deg,#0a1a0a,#1a2d1a,#0a1a2e)" },
  { id: 7, question: "Will S&P 500 hit 6,500?", category: "Finance", yesPercent: 62, volume: "$1.8M", volumeNum: 1800000, ends: "30d", participants: 2567, emoji: "📈", gradient: "linear-gradient(135deg,#1a1a0a,#2d2d0a,#1a0a3e)" },
  { id: 8, question: "Lakers win NBA Championship?", category: "Sports", yesPercent: 34, volume: "$980K", volumeNum: 980000, ends: "120d", participants: 1654, emoji: "🏀", gradient: "linear-gradient(135deg,#1a0a0a,#3d1a0a,#1a0a3e)" },
  { id: 9, question: "Fed cuts rates 3+ times?", category: "Finance", yesPercent: 61, volume: "$2.3M", volumeNum: 2300000, ends: "300d", participants: 2103, emoji: "🏦", gradient: "linear-gradient(135deg,#0a1a1a,#0a2d2d,#0a1a3e)" },
  { id: 10, question: "Apple releases AR glasses?", category: "AI", yesPercent: 83, volume: "$1.6M", volumeNum: 1600000, ends: "400d", participants: 3210, emoji: "🥽", gradient: "linear-gradient(135deg,#1a1a1a,#2d2d2d,#1a1a3e)" },
  { id: 11, question: "Dogecoin reaches $1?", category: "Crypto", yesPercent: 19, volume: "$650K", volumeNum: 650000, ends: "365d", participants: 987, emoji: "🐕", gradient: "linear-gradient(135deg,#1a1a0a,#2d2d1a,#1a1a0a)" },
  { id: 12, question: "Republicans win Senate?", category: "Politics", yesPercent: 58, volume: "$4.1M", volumeNum: 4100000, ends: "245d", participants: 6789, emoji: "🏛️", gradient: "linear-gradient(135deg,#1a0a1a,#2d1a2d,#0a0a2e)" },
];

const TRENDING = [MARKETS[0], MARKETS[1], MARKETS[2]];

const LEADERBOARD_DATA = [
  { rank: 1, username: "CryptoKing", avatar: "👑", tokens: 12540, winRate: 84, predictions: 287, tier: "Oracle", focus: "Crypto" },
  { rank: 2, username: "MoonGirl", avatar: "🌙", tokens: 10320, winRate: 79, predictions: 234, tier: "Oracle", focus: "Crypto" },
  { rank: 3, username: "DeFiDude", avatar: "⚡", tokens: 9750, winRate: 76, predictions: 198, tier: "Oracle", focus: "Finance" },
  { rank: 4, username: "PoliticsPro", avatar: "🏛️", tokens: 8920, winRate: 81, predictions: 167, tier: "Expert", focus: "Politics" },
  { rank: 5, username: "TechOracle", avatar: "💻", tokens: 7840, winRate: 77, predictions: 203, tier: "Expert", focus: "AI" },
  { rank: 6, username: "SportsBet", avatar: "🏆", tokens: 6920, winRate: 72, predictions: 312, tier: "Expert", focus: "Sports" },
  { rank: 7, username: "WhaleWatch", avatar: "🐋", tokens: 5670, winRate: 75, predictions: 178, tier: "Expert", focus: "Crypto" },
  { rank: 8, username: "You", avatar: "🔮", tokens: 0, winRate: 0, predictions: 0, tier: "Novice", focus: "All" },
];

const ACTIVITY_FEED = [
  { user: "Alice", action: "bought", amount: "$400", side: "YES", market: "Eth ETF", time: "2m ago", color: "#00d4aa" },
  { user: "Tom", action: "sold", amount: "$200", side: "NO", market: "Trump 2028", time: "3m ago", color: "#ff6b6b" },
  { user: "Megan", action: "joined", amount: "", side: "", market: "Solana $500", time: "5m ago", color: "#a78bfa" },
  { user: "CryptoKing", action: "bought", amount: "$1,200", side: "YES", market: "BTC $150K", time: "7m ago", color: "#00d4aa" },
  { user: "DeFiDude", action: "bought", amount: "$600", side: "NO", market: "Fed rates", time: "9m ago", color: "#ff6b6b" },
  { user: "MoonGirl", action: "bought", amount: "$850", side: "YES", market: "Apple AR", time: "11m ago", color: "#00d4aa" },
];

const ACTIVE_BETS = [
  { id: 1, market: "Bitcoin to $150K?", category: "Crypto", side: "Yes", amount: 500, potential: 850, odds: 61, ends: "Dec 31, 2026" },
  { id: 2, market: "Lakers NBA Championship?", category: "Sports", side: "No", amount: 300, potential: 590, odds: 34, ends: "Jun 30, 2026" },
  { id: 3, market: "Fed cuts rates 3+ times?", category: "Finance", side: "Yes", amount: 750, potential: 1200, odds: 61, ends: "Dec 31, 2026" },
];

const BET_HISTORY = [
  { id: 1, market: "Trump wins 2024 election?", category: "Politics", side: "Yes", amount: 1000, result: "Won", payout: 1850, date: "Nov 6, 2024", profit: 850 },
  { id: 2, market: "ETH reaches $5K in 2024?", category: "Crypto", side: "Yes", amount: 500, result: "Lost", payout: 0, date: "Dec 31, 2024", profit: -500 },
  { id: 3, market: "Fed rate cut Sept 2024?", category: "Finance", side: "Yes", amount: 800, result: "Won", payout: 1440, date: "Sep 18, 2024", profit: 640 },
  { id: 4, market: "Bitcoin ETF approved?", category: "Crypto", side: "Yes", amount: 1500, result: "Won", payout: 2100, date: "Jan 10, 2024", profit: 600 },
  { id: 5, market: "Nvidia +50% in 2024?", category: "Finance", side: "Yes", amount: 600, result: "Won", payout: 1080, date: "Dec 20, 2024", profit: 480 },
];

// ─── Global styles ─────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#06061a;overflow-x:hidden}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  @keyframes starField{from{transform:translateY(0)}to{transform:translateY(-50%)}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(139,92,246,.3)}50%{box-shadow:0 0 40px rgba(139,92,246,.6)}}
  @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
  .wallet-adapter-button{
    background:linear-gradient(135deg,#7c3aed,#4f46e5)!important;
    border:none!important;border-radius:10px!important;
    font-family:'Space Grotesk',sans-serif!important;
    font-size:13px!important;font-weight:500!important;
    padding:9px 18px!important;height:auto!important;
    color:white!important;letter-spacing:.2px!important;
    transition:all .2s!important;
  }
  .wallet-adapter-button:hover{background:linear-gradient(135deg,#6d28d9,#4338ca)!important;transform:translateY(-1px)!important;}
  .wallet-adapter-button-trigger{background:transparent!important;border:1px solid rgba(139,92,246,.4)!important;color:rgba(255,255,255,.8)!important;}
  .wallet-adapter-button-trigger:hover{background:rgba(139,92,246,.1)!important;border-color:rgba(139,92,246,.7)!important;}
  .nav-btn{transition:all .2s;position:relative}
  .nav-btn:hover{color:white!important}
  .nav-btn.active{color:white!important}
  .nav-btn.active::after{content:'';position:absolute;bottom:-16px;left:0;right:0;height:2px;background:linear-gradient(90deg,#7c3aed,#06b6d4);border-radius:2px}
  .mkt-card{transition:all .25s;cursor:pointer}
  .mkt-card:hover{transform:translateY(-3px)!important;box-shadow:0 12px 40px rgba(139,92,246,.25)!important}
  .trend-card{transition:all .25s;cursor:pointer}
  .trend-card:hover{transform:translateY(-4px)!important}
  .buy-btn{transition:all .2s}
  .buy-btn:hover{transform:translateY(-1px)!important;filter:brightness(1.15)!important}
  .cat-btn{transition:all .2s}
  .cat-btn:hover{border-color:rgba(139,92,246,.6)!important;color:white!important}
  .lb-row{transition:background .15s}
  .lb-row:hover{background:rgba(139,92,246,.06)!important}
  input:focus{outline:none;border-color:rgba(139,92,246,.6)!important}
  input::placeholder{color:rgba(255,255,255,.25)}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:rgba(255,255,255,.03)}
  ::-webkit-scrollbar-thumb{background:rgba(139,92,246,.4);border-radius:2px}
`;

// ─── Splash ───────────────────────────────────────────────────────────────────
const Splash: FC<{ onDone: () => void }> = ({ onDone }) => {
  const [pct, setPct] = useState(0);
  const [out, setOut] = useState(false);
  useEffect(() => {
    const t0 = Date.now(); const dur = 2600;
    const tick = () => {
      const p = Math.min((Date.now()-t0)/dur,1);
      const e = p<.5?2*p*p:-1+(4-2*p)*p;
      setPct(Math.floor(e*100));
      if(p<1) requestAnimationFrame(tick);
      else { setOut(true); setTimeout(onDone, 600); }
    };
    requestAnimationFrame(tick);
  }, [onDone]);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#06061a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', opacity: out?0:1, transition:'opacity .6s', fontFamily:"'Space Grotesk',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>
      {/* Stars */}
      {Array.from({length:60}).map((_,i)=>(
        <div key={i} style={{ position:'absolute', width: Math.random()*2+1+'px', height: Math.random()*2+1+'px', borderRadius:'50%', background:'white', top: Math.random()*100+'%', left: Math.random()*100+'%', opacity: Math.random()*.7+.1, animation:`pulse ${Math.random()*3+2}s ease-in-out infinite` }} />
      ))}
      {/* Glow orbs */}
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,.15),transparent 70%)', filter:'blur(60px)', top:'20%', left:'30%' }} />
      <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(6,182,212,.1),transparent 70%)', filter:'blur(40px)', top:'50%', left:'60%' }} />
      {/* Scanline */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent,rgba(124,58,237,.6),transparent)', animation:'scanline 3s linear infinite' }} />
      {/* Logo */}
      <div style={{ position:'relative', marginBottom:24 }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, boxShadow:'0 0 60px rgba(124,58,237,.6)', animation:'glow 2s ease-in-out infinite', marginBottom:20, margin:'0 auto 20px' }}>🔮</div>
        <div style={{ textAlign:'center', fontSize:32, fontWeight:700, background:'linear-gradient(90deg,#a78bfa,#38bdf8,#a78bfa)', backgroundSize:'200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', animation:'shimmer 3s linear infinite', letterSpacing:4 }}>ORACLE</div>
        <div style={{ textAlign:'center', fontSize:11, letterSpacing:4, color:'rgba(255,255,255,.3)', marginTop:6 }}>PREDICTION MARKETS · SOLANA</div>
      </div>
      {/* Counter */}
      <div style={{ marginTop:40, fontSize:72, fontWeight:300, color:'white', letterSpacing:-4, fontVariantNumeric:'tabular-nums', textShadow:'0 0 30px rgba(124,58,237,.5)' }}>
        {String(pct).padStart(3,'0')}<span style={{ fontSize:20, color:'rgba(255,255,255,.3)', marginLeft:4 }}>%</span>
      </div>
      {/* Bar */}
      <div style={{ width:260, height:2, background:'rgba(255,255,255,.08)', marginTop:20, borderRadius:1, overflow:'hidden' }}>
        <div style={{ height:'100%', width:pct+'%', background:'linear-gradient(90deg,#7c3aed,#06b6d4)', transition:'width .016s linear', boxShadow:'0 0 10px rgba(124,58,237,.8)' }} />
      </div>
      <div style={{ marginTop:14, fontSize:10, letterSpacing:3, color:'rgba(255,255,255,.25)' }}>
        {pct<30?'CONNECTING TO SOLANA':pct<60?'LOADING MARKETS':pct<90?'SYNCING ORACLE DATA':'READY TO PREDICT'}
      </div>
    </div>
  );
};

// ─── Bet Modal ────────────────────────────────────────────────────────────────
const BetModal: FC<{ market: any; onClose: () => void }> = ({ market, onClose }) => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [side, setSide] = useState<'yes'|'no'>('yes');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [txSig, setTxSig] = useState('');
  const [err, setErr] = useState('');

  const potential = amount ? (side==='yes'
    ? (parseFloat(amount)/(market.yesPercent/100)).toFixed(0)
    : (parseFloat(amount)/((100-market.yesPercent)/100)).toFixed(0)) : '0';

  const handleBet = async () => {
    if (!publicKey) { setErr('Connect your wallet first.'); setStatus('error'); return; }
    if (!amount||parseFloat(amount)<=0) { setErr('Enter a valid amount.'); setStatus('error'); return; }
    setStatus('loading'); setErr('');
    try {
      const { PublicKey: PK, Transaction, SystemProgram } = await import('@solana/web3.js');
      const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
      const idl = (await import('./target/idl/oracle_token.json')).default;
      const { Program, AnchorProvider, BN } = anchor;
      const MARKET_PDA = new PK('CuvChQETTNKYcnDNJwTQccQkQwJpuK8tqv3KWfwB7Jd2');
      const provider = new AnchorProvider(connection, { publicKey, signTransaction:async(tx:any)=>tx, signAllTransactions:async(txs:any)=>txs } as any, { commitment:'confirmed' });
      const program = new Program(idl as any, provider);
      const [predPDA] = PK.findProgramAddressSync([Buffer.from('prediction'),publicKey.toBuffer(),MARKET_PDA.toBuffer()],PROGRAM_ID);
      const [userProfile] = PK.findProgramAddressSync([Buffer.from('profile'),publicKey.toBuffer()],PROGRAM_ID);
      const userTA = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT,publicKey);
      const vault = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT,MARKET_PDA,true);
      const tx = new Transaction();
      if (!await connection.getAccountInfo(userProfile)) {
        tx.add(await (program.methods as any).createUserProfile().accounts({ userProfile, user:publicKey, systemProgram:SystemProgram.programId }).instruction());
      }
      tx.add(await (program.methods as any).makePrediction(side==='yes'?0:1, new BN(Math.floor(parseFloat(amount)))).accounts({ prediction:predPDA, market:MARKET_PDA, userProfile, user:publicKey, userTokenAccount:userTA, marketVault:vault, tokenProgram:TOKEN_PROGRAM_ID, systemProgram:SystemProgram.programId }).instruction());
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash=blockhash; tx.feePayer=publicKey;
      const sig = await sendTransaction(tx,connection);
      await connection.confirmTransaction(sig,'confirmed');
      setTxSig(sig); setStatus('success');
    } catch(e:any) { setErr(e?.message||'Transaction failed.'); setStatus('error'); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:16, fontFamily:"'Space Grotesk',sans-serif" }} onClick={onClose}>
      <div style={{ background:'linear-gradient(135deg,#0d0d2b,#13133a)', border:'1px solid rgba(139,92,246,.3)', borderRadius:16, padding:28, maxWidth:440, width:'100%', boxShadow:'0 20px 60px rgba(124,58,237,.3)', animation:'slideIn .25s ease' }} onClick={e=>e.stopPropagation()}>
        {status==='success' ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(16,185,129,.15)', border:'1px solid rgba(16,185,129,.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:24 }}>✓</div>
            <div style={{ fontSize:20, fontWeight:600, color:'white', marginBottom:6 }}>Prediction Placed! 🎉</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,.5)', marginBottom:20 }}>Your {side.toUpperCase()} prediction is live on Solana</div>
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:16, marginBottom:16, textAlign:'left' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[{l:'Amount',v:parseFloat(amount).toLocaleString()+' OCT'},{l:'Potential Win',v:parseFloat(potential).toLocaleString()+' OCT',green:true}].map((s,i)=>(
                  <div key={i}><div style={{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 }}>{s.l}</div><div style={{ fontSize:15, fontWeight:600, color:(s as any).green?'#10b981':'white' }}>{s.v}</div></div>
                ))}
              </div>
            </div>
            <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ display:'block', fontSize:11, color:'rgba(139,92,246,.8)', marginBottom:20, wordBreak:'break-all', textDecoration:'none' }}>{txSig.slice(0,24)}...{txSig.slice(-8)} ↗</a>
            <button onClick={onClose} style={{ width:'100%', padding:12, borderRadius:10, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)', fontSize:14, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif" }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:10, letterSpacing:2, color:'rgba(139,92,246,.7)', textTransform:'uppercase', marginBottom:6 }}>Place Prediction</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,.75)', lineHeight:1.5, maxWidth:340 }}>{market.question}</div>
              </div>
              <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,.3)', fontSize:22, cursor:'pointer' }}>×</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
              {[['yes','#10b981','rgba(16,185,129,.15)','rgba(16,185,129,.35)',market.yesPercent],['no','#ef4444','rgba(239,68,68,.15)','rgba(239,68,68,.35)',100-market.yesPercent]].map(([s,c,bg,bc,pct]:any)=>(
                <button key={s} onClick={()=>setSide(s)} style={{ padding:'13px 8px', borderRadius:10, border:`1px solid ${side===s?bc:'rgba(255,255,255,.08)'}`, background: side===s?bg:'rgba(255,255,255,.03)', color: side===s?c:'rgba(255,255,255,.4)', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s', letterSpacing:.5 }}>
                  {s.toUpperCase()} · {pct}%
                </button>
              ))}
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, letterSpacing:2, color:'rgba(255,255,255,.3)', textTransform:'uppercase', marginBottom:8 }}>Amount (OCT Tokens)</div>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, padding:'11px 14px', color:'white', fontSize:18, fontFamily:"'Space Grotesk',sans-serif", transition:'border-color .2s' }} />
              <div style={{ display:'flex', gap:6, marginTop:8 }}>
                {[50,100,250,500].map(n=>(
                  <button key={n} onClick={()=>setAmount(String(n))} style={{ flex:1, padding:'7px 4px', borderRadius:8, border:'1px solid rgba(255,255,255,.08)', background:'rgba(255,255,255,.03)', color:'rgba(255,255,255,.45)', fontSize:12, cursor:'pointer', transition:'all .15s', fontFamily:"'Space Grotesk',sans-serif" }}
                    onMouseOver={e=>{(e.target as any).style.background='rgba(139,92,246,.15)';(e.target as any).style.color='white'}}
                    onMouseOut={e=>{(e.target as any).style.background='rgba(255,255,255,.03)';(e.target as any).style.color='rgba(255,255,255,.45)'}}>{n}</button>
                ))}
              </div>
            </div>

            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
              {[{l:'Your Prediction',v:`${side.toUpperCase()} @ ${side==='yes'?market.yesPercent:100-market.yesPercent}%`,c:side==='yes'?'#10b981':'#ef4444'},{l:'Amount',v:(amount||'0')+' OCT',c:'rgba(255,255,255,.6)'},{l:'Potential Win',v:potential+' OCT',c:'#10b981',sep:true}].map((r,i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:(r as any).sep?10:0, marginTop:(r as any).sep?10:0, borderTop:(r as any).sep?'1px solid rgba(255,255,255,.06)':'none', marginBottom:i<2?8:0 }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,.3)', letterSpacing:.3 }}>{r.l}</span>
                  <span style={{ fontSize:13, color:r.c, fontWeight:600 }}>{r.v}</span>
                </div>
              ))}
            </div>

            {status==='error' && <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, padding:'9px 13px', marginBottom:12, fontSize:12, color:'rgba(239,68,68,.9)' }}>{err}</div>}

            <button onClick={handleBet} disabled={status==='loading'||!amount} style={{ width:'100%', padding:13, borderRadius:10, border:'none', background: (!amount||status==='loading')?'rgba(139,92,246,.3)':'linear-gradient(135deg,#7c3aed,#4f46e5)', color:'white', fontSize:14, fontWeight:600, cursor: (!amount||status==='loading')?'not-allowed':'pointer', transition:'all .2s', fontFamily:"'Space Grotesk',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {status==='loading'?<><svg style={{animation:'spin 1s linear infinite',width:16,height:16}} viewBox="0 0 24 24" fill="none"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Confirming on Solana...</>:<>Confirm Prediction 🔮</>}
            </button>
            <div style={{ textAlign:'center', fontSize:10, color:'rgba(255,255,255,.2)', marginTop:10, letterSpacing:.5 }}>SOLANA DEVNET · ~0.001 SOL NETWORK FEE</div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Market Card ──────────────────────────────────────────────────────────────
const MarketCard: FC<{ market: any; featured?: boolean }> = ({ market, featured }) => {
  const [modal, setModal] = useState(false);
  const yesColor = market.yesPercent >= 50 ? '#00d4aa' : '#ff6b6b';
  const noColor = market.yesPercent < 50 ? '#00d4aa' : '#ff6b6b';

  if (featured) return (
    <>
      <div className="trend-card" style={{ background: market.gradient, border:'1px solid rgba(139,92,246,.25)', borderRadius:14, padding:20, position:'relative', overflow:'hidden', minHeight:160 }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 70% 50%,rgba(139,92,246,.15),transparent 60%)' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:22, marginBottom:8 }}>{market.emoji}</div>
          <div style={{ fontSize:15, fontWeight:600, color:'white', marginBottom:12, lineHeight:1.4 }}>{market.question}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <span style={{ fontSize:13, color:'rgba(255,255,255,.5)' }}>YES</span>
            <span style={{ fontSize:32, fontWeight:700, color:yesColor, letterSpacing:-1 }}>{market.yesPercent}%</span>
          </div>
          <button onClick={()=>setModal(true)} className="buy-btn" style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', border:'none', borderRadius:8, padding:'9px 20px', color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif" }}>Trade Now</button>
        </div>
        <div style={{ position:'absolute', bottom:10, right:14, fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:.5 }}>
          {market.volume} · {market.participants.toLocaleString()} traders
        </div>
      </div>
      {modal && <BetModal market={market} onClose={()=>setModal(false)} />}
    </>
  );

  return (
    <>
      <div className="mkt-card" style={{ background:'linear-gradient(135deg,rgba(13,13,43,.9),rgba(19,19,58,.9))', border:'1px solid rgba(139,92,246,.18)', borderRadius:14, padding:18, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg,transparent,rgba(139,92,246,.4),transparent)` }} />
        <div style={{ fontSize:24, marginBottom:10 }}>{market.emoji}</div>
        <div style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,.85)', marginBottom:14, lineHeight:1.45, minHeight:40 }}>{market.question}</div>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <span style={{ fontSize:22, fontWeight:700, color:yesColor }}>{market.yesPercent}%</span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>YES</span>
          <span style={{ flex:1 }} />
          <span style={{ fontSize:22, fontWeight:700, color:noColor }}>{100-market.yesPercent}%</span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>NO</span>
        </div>

        <div style={{ height:3, background:'rgba(255,255,255,.06)', borderRadius:2, marginBottom:12, overflow:'hidden' }}>
          <div style={{ height:'100%', width:market.yesPercent+'%', background:`linear-gradient(90deg,${yesColor},rgba(0,212,170,.3))`, borderRadius:2 }} />
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,.35)', marginBottom:14 }}>
          <span>{market.volume}</span>
          <span>Ends in {market.ends}</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
          <button onClick={()=>setModal(true)} className="buy-btn" style={{ padding:'8px 0', borderRadius:8, border:'1px solid rgba(0,212,170,.3)', background:'rgba(0,212,170,.1)', color:'#00d4aa', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif" }}>Buy YES</button>
          <button onClick={()=>setModal(true)} className="buy-btn" style={{ padding:'8px 0', borderRadius:8, border:'1px solid rgba(239,68,68,.3)', background:'rgba(239,68,68,.1)', color:'#ff6b6b', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif" }}>Buy NO</button>
        </div>
      </div>
      {modal && <BetModal market={market} onClose={()=>setModal(false)} />}
    </>
  );
};

// ─── Create Market ────────────────────────────────────────────────────────────
const CreateMarketPage: FC = () => {
  const [form, setForm] = useState({ question:'', category:'Crypto', endDays:'90', description:'', yesLabel:'Yes', noLabel:'No' });
  const [status, setStatus] = useState<'idle'|'loading'|'success'>('idle');
  const { connected } = useWallet();

  const handle = (k: string, v: string) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async () => {
    if (!form.question) return;
    setStatus('loading');
    await new Promise(r=>setTimeout(r,1500));
    setStatus('success');
  };

  if (status==='success') return (
    <div style={{ maxWidth:600, margin:'60px auto', padding:'0 28px', fontFamily:"'Space Grotesk',sans-serif", textAlign:'center' }}>
      <div style={{ fontSize:56, marginBottom:20, animation:'float 3s ease-in-out infinite' }}>🔮</div>
      <div style={{ fontSize:26, fontWeight:700, color:'white', marginBottom:10 }}>Market Created!</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,.45)', marginBottom:30 }}>Your prediction market is being deployed to Solana devnet.</div>
      <button onClick={()=>setStatus('idle')} style={{ padding:'12px 32px', borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#4f46e5)', border:'none', color:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif" }}>Create Another</button>
    </div>
  );

  return (
    <div style={{ maxWidth:700, margin:'0 auto', padding:'32px 28px', fontFamily:"'Space Grotesk',sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:'rgba(139,92,246,.7)', textTransform:'uppercase', marginBottom:10 }}>New Market</div>
        <h1 style={{ fontSize:28, fontWeight:700, color:'white', letterSpacing:-.5, marginBottom:8 }}>Create Prediction Market</h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,.4)', lineHeight:1.6 }}>Launch a market on Solana. Traders stake Oracle Tokens on YES or NO outcomes.</p>
      </div>

      {!connected && (
        <div style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.25)', borderRadius:12, padding:'14px 18px', marginBottom:24, fontSize:13, color:'rgba(245,158,11,.9)', display:'flex', alignItems:'center', gap:10 }}>
          ⚠️ Connect your wallet to deploy a market on-chain
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {/* Question */}
        <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(139,92,246,.15)', borderRadius:14, padding:20 }}>
          <div style={{ fontSize:11, letterSpacing:2, color:'rgba(139,92,246,.7)', textTransform:'uppercase', marginBottom:12 }}>Market Question</div>
          <input value={form.question} onChange={e=>handle('question',e.target.value)} placeholder="e.g. Will Bitcoin reach $200K by 2027?" style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, padding:'12px 14px', color:'white', fontSize:15, fontFamily:"'Space Grotesk',sans-serif", transition:'border-color .2s' }} />
          <textarea value={form.description} onChange={e=>handle('description',e.target.value)} placeholder="Optional: add context or resolution criteria..." style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, padding:'12px 14px', color:'white', fontSize:13, fontFamily:"'Space Grotesk',sans-serif", marginTop:10, minHeight:80, resize:'vertical', transition:'border-color .2s' } as any} />
        </div>

        {/* Category + Duration */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(139,92,246,.15)', borderRadius:14, padding:20 }}>
            <div style={{ fontSize:11, letterSpacing:2, color:'rgba(139,92,246,.7)', textTransform:'uppercase', marginBottom:12 }}>Category</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {CATEGORIES.filter(c=>c!=='All').map(c=>(
                <button key={c} onClick={()=>handle('category',c)} className="cat-btn" style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${form.category===c?'rgba(139,92,246,.6)':'rgba(255,255,255,.08)'}`, background: form.category===c?'rgba(139,92,246,.15)':'transparent', color: form.category===c?'white':'rgba(255,255,255,.4)', fontSize:12, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", transition:'all .2s' }}>{c}</button>
              ))}
            </div>
          </div>
          <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(139,92,246,.15)', borderRadius:14, padding:20 }}>
            <div style={{ fontSize:11, letterSpacing:2, color:'rgba(139,92,246,.7)', textTransform:'uppercase', marginBottom:12 }}>Duration</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {[['30','30 Days'],['90','90 Days'],['180','6 Months'],['365','1 Year']].map(([v,l])=>(
                <button key={v} onClick={()=>handle('endDays',v)} className="cat-btn" style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${form.endDays===v?'rgba(139,92,246,.6)':'rgba(255,255,255,.08)'}`, background: form.endDays===v?'rgba(139,92,246,.15)':'transparent', color: form.endDays===v?'white':'rgba(255,255,255,.4)', fontSize:12, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", transition:'all .2s' }}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Outcomes */}
        <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(139,92,246,.15)', borderRadius:14, padding:20 }}>
          <div style={{ fontSize:11, letterSpacing:2, color:'rgba(139,92,246,.7)', textTransform:'uppercase', marginBottom:12 }}>Outcomes</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:'rgba(0,212,170,.6)', marginBottom:6 }}>YES Outcome</div>
              <input value={form.yesLabel} onChange={e=>handle('yesLabel',e.target.value)} style={{ width:'100%', background:'rgba(0,212,170,.06)', border:'1px solid rgba(0,212,170,.2)', borderRadius:8, padding:'10px 12px', color:'white', fontSize:13, fontFamily:"'Space Grotesk',sans-serif" }} />
            </div>
            <div>
              <div style={{ fontSize:11, color:'rgba(239,68,68,.6)', marginBottom:6 }}>NO Outcome</div>
              <input value={form.noLabel} onChange={e=>handle('noLabel',e.target.value)} style={{ width:'100%', background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, padding:'10px 12px', color:'white', fontSize:13, fontFamily:"'Space Grotesk',sans-serif" }} />
            </div>
          </div>
        </div>

        {/* Info box */}
        <div style={{ background:'rgba(139,92,246,.06)', border:'1px solid rgba(139,92,246,.2)', borderRadius:12, padding:'14px 18px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
          {[{l:'Creation Fee',v:'~0.01 SOL'},{l:'Min Stake',v:'1 OCT'},{l:'Oracle Reward',v:'2% of pool'}].map((s,i)=>(
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 }}>{s.l}</div>
              <div style={{ fontSize:15, fontWeight:600, color:'rgba(139,92,246,.9)' }}>{s.v}</div>
            </div>
          ))}
        </div>

        <button onClick={handleSubmit} disabled={!form.question||status==='loading'} style={{ width:'100%', padding:14, borderRadius:12, border:'none', background: !form.question?'rgba(139,92,246,.3)':'linear-gradient(135deg,#7c3aed,#4f46e5)', color:'white', fontSize:15, fontWeight:600, cursor: !form.question?'not-allowed':'pointer', fontFamily:"'Space Grotesk',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .2s' }}>
          {status==='loading'?<><svg style={{animation:'spin 1s linear infinite',width:16,height:16}} viewBox="0 0 24 24" fill="none"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Deploying to Solana...</>:<>🚀 Deploy Market</>}
        </button>
      </div>
    </div>
  );
};

// ─── Markets Home ─────────────────────────────────────────────────────────────
const MarketsPage: FC = () => {
  const [cat, setCat] = useState('All');
  const [tick, setTick] = useState(0);

  useEffect(()=>{ const i = setInterval(()=>setTick(t=>t+1),5000); return ()=>clearInterval(i); },[]);

  const filtered = cat==='All' ? MARKETS : MARKETS.filter(m=>m.category===cat);
  const topTraders = LEADERBOARD_DATA.slice(0,3);
  const actFeed = ACTIVITY_FEED.slice(0, tick%2===0?ACTIVITY_FEED.length:ACTIVITY_FEED.length);

  return (
    <div style={{ maxWidth:1240, margin:'0 auto', padding:'28px 28px', fontFamily:"'Space Grotesk',sans-serif" }}>

      {/* Trending */}
      <div style={{ marginBottom:32 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#f59e0b', boxShadow:'0 0 10px #f59e0b', animation:'pulse 2s ease-in-out infinite' }} />
          <h2 style={{ fontSize:18, fontWeight:700, color:'white', letterSpacing:-.3 }}>Trending Markets</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {TRENDING.map(m=><MarketCard key={m.id} market={m} featured />)}
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {CATEGORIES.map(c=>(
          <button key={c} onClick={()=>setCat(c)} className="cat-btn" style={{ padding:'7px 18px', borderRadius:20, border:`1px solid ${cat===c?'rgba(139,92,246,.7)':'rgba(255,255,255,.1)'}`, background: cat===c?'rgba(139,92,246,.2)':'transparent', color: cat===c?'white':'rgba(255,255,255,.5)', fontSize:13, fontWeight: cat===c?600:400, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", transition:'all .2s' }}>{c}</button>
        ))}
      </div>

      {/* Markets grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:36 }}>
        {filtered.slice(0,8).map(m=><MarketCard key={m.id} market={m} />)}
      </div>

      {/* Bottom row */}
      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr 300px', gap:14 }}>
        {/* Top Traders */}
        <div style={{ background:'rgba(13,13,43,.8)', border:'1px solid rgba(139,92,246,.18)', borderRadius:14, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'white', marginBottom:14 }}>🏆 Top Traders</div>
          {topTraders.map((u,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i<2?'1px solid rgba(255,255,255,.05)':'none' }}>
              <div style={{ fontSize:13, color: i===0?'#f59e0b':i===1?'rgba(200,200,200,.7)':'rgba(180,120,60,.8)', fontWeight:700, minWidth:20 }}>{i+1}.</div>
              <span style={{ fontSize:18 }}>{u.avatar}</span>
              <span style={{ fontSize:13, color:'rgba(255,255,255,.8)', flex:1 }}>{u.username}</span>
              <span style={{ fontSize:12, color:'rgba(139,92,246,.9)', fontWeight:600 }}>{u.tokens.toLocaleString()} pts</span>
            </div>
          ))}
        </div>

        {/* Center visual */}
        <div style={{ background:'rgba(13,13,43,.8)', border:'1px solid rgba(139,92,246,.18)', borderRadius:14, padding:24, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 50% 80%,rgba(124,58,237,.25),transparent 60%)' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'60%', background:'repeating-linear-gradient(90deg,transparent,transparent 30px,rgba(139,92,246,.05) 30px,rgba(139,92,246,.05) 31px)', transform:'perspective(200px) rotateX(45deg)', transformOrigin:'bottom' }} />
          <div style={{ position:'relative', textAlign:'center' }}>
            <div style={{ fontSize:42, marginBottom:12, animation:'float 4s ease-in-out infinite' }}>🔮</div>
            <div style={{ fontSize:16, fontWeight:700, color:'white', marginBottom:4 }}>{MARKETS.length} Active Markets</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.35)' }}>Powered by Solana · Devnet</div>
          </div>
        </div>

        {/* Activity Feed */}
        <div style={{ background:'rgba(13,13,43,.8)', border:'1px solid rgba(139,92,246,.18)', borderRadius:14, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'white', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', animation:'pulse 1.5s ease-in-out infinite' }} />
            Activity Feed
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {actFeed.map((a,i)=>(
              <div key={i} style={{ padding:'9px 0', borderBottom: i<actFeed.length-1?'1px solid rgba(255,255,255,.05)':'none', animation:'slideIn .3s ease' }}>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.65)', lineHeight:1.5 }}>
                  <span style={{ color:'white', fontWeight:600 }}>{a.user}</span>
                  {' '}{a.action}{' '}
                  {a.amount && <span style={{ color:a.color, fontWeight:600 }}>{a.amount}</span>}
                  {a.side && <span style={{ color:a.color }}>{' '}&ldquo;{a.side}&rdquo;</span>}
                  {' on '}<span style={{ color:'rgba(139,92,246,.8)' }}>{a.market}</span>
                </div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.25)', marginTop:2 }}>{a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Leaderboard ──────────────────────────────────────────────────────────────
const LeaderboardPage: FC<{ octBalance: number }> = ({ octBalance }) => {
  const [cat, setCat] = useState('All');
  const data = LEADERBOARD_DATA.map((u,i) => i===7 ? {...u, tokens: octBalance} : u);
  const rows = cat==='All' ? data : data.filter(u=>u.focus===cat||u.username==='You');
  const you = data.find(u=>u.username==='You')!;
  const tierColor = (t:string) => t==='Oracle'?'#f59e0b':t==='Expert'?'#a78bfa':'rgba(96,165,250,.8)';
  const tierBg = (t:string) => t==='Oracle'?'rgba(245,158,11,.12)':t==='Expert'?'rgba(139,92,246,.12)':'rgba(96,165,250,.1)';

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 28px', fontFamily:"'Space Grotesk',sans-serif" }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:'rgba(139,92,246,.7)', textTransform:'uppercase', marginBottom:10 }}>Hall of Oracles</div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:700, color:'white', letterSpacing:-.5, marginBottom:6 }}>Leaderboard <span style={{ color:'rgba(255,255,255,.3)', fontWeight:300 }}>· top predictors</span></h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.35)' }}>Ranked by Oracle Tokens earned through accurate predictions</p>
          </div>
          <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(139,92,246,.2)', borderRadius:12, padding:'14px 22px', display:'flex', alignItems:'center', gap:20 }}>
            <div><div style={{ fontSize:9, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Your Rank</div><div style={{ fontSize:24, fontWeight:700, color:'white' }}>#{you.rank}</div></div>
            <div style={{ width:1, height:32, background:'rgba(255,255,255,.08)' }} />
            {[{l:'Tokens',v:octBalance>0?octBalance.toLocaleString():'—'},{l:'Win Rate',v:you.winRate>0?you.winRate+'%':'—'}].map((s,i)=>(
              <div key={i}><div style={{ fontSize:9, color:'rgba(255,255,255,.3)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 }}>{s.l}</div><div style={{ fontSize:15, fontWeight:600, color:'white' }}>{s.v}</div></div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setCat(c)} className="cat-btn" style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${cat===c?'rgba(139,92,246,.6)':'rgba(255,255,255,.08)'}`, background: cat===c?'rgba(139,92,246,.15)':'transparent', color: cat===c?'white':'rgba(255,255,255,.4)', fontSize:12, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", transition:'all .2s' }}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ background:'rgba(13,13,43,.6)', border:'1px solid rgba(139,92,246,.15)', borderRadius:14, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 100px 130px 160px 80px 90px', gap:16, padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)' }}>
          {['Rank','Trader','Tier','Tokens','Win Rate','W/L','Focus'].map((h,i)=>(
            <div key={i} style={{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:2, textTransform:'uppercase' }}>{h}</div>
          ))}
        </div>
        {rows.map((u,idx)=>(
          <div key={u.rank} className="lb-row" style={{ display:'grid', gridTemplateColumns:'60px 1fr 100px 130px 160px 80px 90px', gap:16, padding:'13px 18px', borderBottom: idx<rows.length-1?'1px solid rgba(255,255,255,.04)':'none', alignItems:'center', background: u.username==='You'?'rgba(139,92,246,.06)':'transparent', borderLeft: u.username==='You'?'2px solid rgba(139,92,246,.5)':'2px solid transparent' }}>
            <div style={{ fontSize:13, fontWeight:700, color: idx===0?'#f59e0b':idx===1?'rgba(200,200,200,.7)':idx===2?'rgba(180,120,60,.8)':'rgba(255,255,255,.3)' }}>
              {idx<3?['01','02','03'][idx]:'#'+u.rank}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>{u.avatar}</span>
              <span style={{ fontSize:13, fontWeight:500, color: u.username==='You'?'rgba(139,92,246,.9)':'rgba(255,255,255,.85)' }}>{u.username}</span>
            </div>
            <div style={{ fontSize:10, padding:'3px 9px', borderRadius:5, background:tierBg(u.tier), color:tierColor(u.tier), fontWeight:600, display:'inline-block', letterSpacing:.5, textTransform:'uppercase' }}>{u.tier}</div>
            <div style={{ fontSize:13, fontWeight:600, color:'#10b981' }}>{u.tokens>0?u.tokens.toLocaleString():'—'}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,.5)', minWidth:34 }}>{u.winRate>0?u.winRate+'%':'—'}</span>
              {u.winRate>0 && <div style={{ flex:1, height:3, background:'rgba(255,255,255,.06)', borderRadius:2, overflow:'hidden' }}><div style={{ height:'100%', width:u.winRate+'%', background:'linear-gradient(90deg,#10b981,rgba(16,185,129,.4))', borderRadius:2 }} /></div>}
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.3)' }}>{u.predictions>0?`${u.wins}/${u.predictions}`:'—'}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{u.focus}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Activity / Predictions ───────────────────────────────────────────────────
const ActivityPage: FC = () => {
  const [tab, setTab] = useState<'active'|'history'>('active');
  const wins = BET_HISTORY.filter(b=>b.result==='Won').length;
  const pnl = BET_HISTORY.reduce((s,b)=>s+b.profit,0);

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 28px', fontFamily:"'Space Grotesk',sans-serif" }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:'rgba(139,92,246,.7)', textTransform:'uppercase', marginBottom:10 }}>My Activity</div>
        <h1 style={{ fontSize:28, fontWeight:700, color:'white', letterSpacing:-.5, marginBottom:20 }}>Predictions</h1>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { l:'Active Bets', v:String(ACTIVE_BETS.length), c:'white' },
            { l:'Total Resolved', v:String(BET_HISTORY.length), c:'white' },
            { l:'Win Rate', v:((wins/BET_HISTORY.length)*100).toFixed(0)+'%', c:'#10b981' },
            { l:'Total P&L', v:(pnl>0?'+':'')+pnl.toLocaleString()+' OCT', c: pnl>=0?'#10b981':'#ef4444' },
          ].map((s,i)=>(
            <div key={i} style={{ background:'rgba(13,13,43,.8)', border:'1px solid rgba(139,92,246,.15)', borderRadius:12, padding:'16px 18px' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>{s.l}</div>
              <div style={{ fontSize:22, fontWeight:700, color:s.c, letterSpacing:-.5 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:0, borderBottom:'1px solid rgba(255,255,255,.08)', marginBottom:20 }}>
        {[['active',`Active (${ACTIVE_BETS.length})`],['history',`History (${BET_HISTORY.length})`]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t as any)} style={{ padding:'10px 22px', background:'none', border:'none', color: tab===t?'white':'rgba(255,255,255,.4)', fontSize:14, fontWeight: tab===t?600:400, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", borderBottom: tab===t?'2px solid #7c3aed':'2px solid transparent', marginBottom:-1, transition:'all .2s' }}>{l}</button>
        ))}
      </div>

      {tab==='active' && (
        <div style={{ background:'rgba(13,13,43,.6)', border:'1px solid rgba(139,92,246,.15)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 100px 120px 110px 120px', gap:16, padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)' }}>
            {['Market','Side','Amount','Potential Win','Current Odds','Ends'].map((h,i)=>(
              <div key={i} style={{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:2, textTransform:'uppercase' }}>{h}</div>
            ))}
          </div>
          {ACTIVE_BETS.map((b,idx)=>(
            <div key={b.id} className="lb-row" style={{ display:'grid', gridTemplateColumns:'1fr 80px 100px 120px 110px 120px', gap:16, padding:'13px 18px', borderBottom: idx<ACTIVE_BETS.length-1?'1px solid rgba(255,255,255,.04)':'none', alignItems:'center' }}>
              <div><div style={{ fontSize:13, color:'rgba(255,255,255,.85)', marginBottom:2 }}>{b.market}</div><div style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>{b.category}</div></div>
              <div style={{ fontSize:11, padding:'3px 9px', borderRadius:5, background: b.side==='Yes'?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)', color: b.side==='Yes'?'#10b981':'#ef4444', fontWeight:600, display:'inline-block', textTransform:'uppercase' }}>{b.side}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.6)', fontWeight:500 }}>{b.amount} OCT</div>
              <div style={{ fontSize:13, color:'#10b981', fontWeight:600 }}>{b.potential} OCT</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ flex:1, height:3, background:'rgba(255,255,255,.06)', borderRadius:2, overflow:'hidden' }}><div style={{ height:'100%', width:b.odds+'%', background:'linear-gradient(90deg,#10b981,rgba(16,185,129,.4))' }} /></div>
                <span style={{ fontSize:11, color:'rgba(255,255,255,.4)', minWidth:28 }}>{b.odds}%</span>
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{b.ends}</div>
            </div>
          ))}
        </div>
      )}

      {tab==='history' && (
        <div style={{ background:'rgba(13,13,43,.6)', border:'1px solid rgba(139,92,246,.15)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 100px 80px 110px 90px', gap:16, padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)' }}>
            {['Market','Side','Amount','Result','Payout','P&L'].map((h,i)=>(
              <div key={i} style={{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:2, textTransform:'uppercase' }}>{h}</div>
            ))}
          </div>
          {BET_HISTORY.map((b,idx)=>(
            <div key={b.id} className="lb-row" style={{ display:'grid', gridTemplateColumns:'1fr 80px 100px 80px 110px 90px', gap:16, padding:'13px 18px', borderBottom: idx<BET_HISTORY.length-1?'1px solid rgba(255,255,255,.04)':'none', alignItems:'center' }}>
              <div><div style={{ fontSize:13, color:'rgba(255,255,255,.85)', marginBottom:2 }}>{b.market}</div><div style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>{b.category} · {b.date}</div></div>
              <div style={{ fontSize:11, padding:'3px 9px', borderRadius:5, background: b.side==='Yes'?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)', color: b.side==='Yes'?'#10b981':'#ef4444', fontWeight:600, display:'inline-block', textTransform:'uppercase' }}>{b.side}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.5)' }}>{b.amount} OCT</div>
              <div style={{ fontSize:11, padding:'3px 9px', borderRadius:5, background: b.result==='Won'?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)', color: b.result==='Won'?'#10b981':'#ef4444', fontWeight:600, display:'inline-block' }}>{b.result}</div>
              <div style={{ fontSize:13, color: b.result==='Won'?'#10b981':'rgba(255,255,255,.3)', fontWeight: b.result==='Won'?600:400 }}>{b.result==='Won'?b.payout+' OCT':'—'}</div>
              <div style={{ fontSize:14, fontWeight:700, color: b.profit>0?'#10b981':'#ef4444', letterSpacing:-.3 }}>{b.profit>0?'+':''}{b.profit}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Analytics ────────────────────────────────────────────────────────────────
const AnalyticsPage: FC = () => {
  const pnlData = [
    { month:'Oct', val: 120 }, { month:'Nov', val: 340 }, { month:'Dec', val: 180 },
    { month:'Jan', val: 520 }, { month:'Feb', val: 390 }, { month:'Mar', val: 710 },
  ];
  const categoryData = [
    { cat:'Crypto', wins:8, total:11 }, { cat:'Politics', wins:3, total:7 },
    { cat:'AI', wins:5, total:6 }, { cat:'Sports', wins:2, total:5 }, { cat:'Finance', wins:4, total:5 },
  ];
  const volumeData = [
    { label:'Crypto', pct:42, color:'#7c3aed' }, { label:'Politics', pct:23, color:'#4f46e5' },
    { label:'AI', pct:18, color:'#06b6d4' }, { label:'Sports', pct:10, color:'#10b981' },
    { label:'Finance', pct:7, color:'#f59e0b' },
  ];
  const maxPnl = Math.max(...pnlData.map(d=>d.val));
  const totalWins = categoryData.reduce((s,d)=>s+d.wins,0);
  const totalBets = categoryData.reduce((s,d)=>s+d.total,0);
  const totalPnl = pnlData.reduce((s,d)=>s+d.val,0);

  const donutR = 60, donutCx = 80, donutCy = 80, donutStroke = 20;
  const circumference = 2 * Math.PI * donutR;
  let offset = 0;
  const donutSlices = volumeData.map(d => {
    const len = (d.pct / 100) * circumference;
    const slice = { ...d, dashArray: `${len} ${circumference - len}`, dashOffset: -offset };
    offset += len;
    return slice;
  });

  const card = (children: React.ReactNode, extraStyle?: React.CSSProperties) => (
    <div style={{ background:'rgba(13,13,43,.8)', border:'1px solid rgba(139,92,246,.15)', borderRadius:14, padding:'22px 24px', ...extraStyle }}>{children}</div>
  );

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 28px', fontFamily:"'Space Grotesk',sans-serif" }}>
      <div style={{ fontSize:10, letterSpacing:3, color:'rgba(139,92,246,.7)', textTransform:'uppercase', marginBottom:8 }}>Overview</div>
      <h1 style={{ fontSize:28, fontWeight:700, color:'white', letterSpacing:-.5, marginBottom:24 }}>
        Analytics <span style={{ color:'rgba(255,255,255,.3)', fontWeight:300 }}>· performance</span>
      </h1>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { l:'Total P&L', v:'+'+totalPnl+' OCT', c:'#10b981' },
          { l:'Win Rate', v:((totalWins/totalBets)*100).toFixed(0)+'%', c:'#7c3aed' },
          { l:'Total Bets', v:String(totalBets), c:'white' },
          { l:'Avg ROI', v:'+34.2%', c:'#06b6d4' },
        ].map((s,i)=>(
          <div key={i} style={{ background:'rgba(13,13,43,.8)', border:'1px solid rgba(139,92,246,.15)', borderRadius:14, padding:'22px 24px' }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>{s.l}</div>
            <div style={{ fontSize:26, fontWeight:700, color:s.c, letterSpacing:-.5 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16, marginBottom:16 }}>
        {card(
          <>
            <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,.6)', marginBottom:20 }}>P&amp;L Over Time (OCT)</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:160 }}>
              {pnlData.map((d,i)=>(
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', marginBottom:2 }}>+{d.val}</div>
                  <div style={{ width:'100%', height:(d.val/maxPnl)*130+'px', borderRadius:'4px 4px 0 0', background:'linear-gradient(180deg,#7c3aed,rgba(124,58,237,.25))', boxShadow:'0 0 12px rgba(124,58,237,.3)' }} />
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.25)', paddingTop:4 }}>{d.month}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {card(
          <>
            <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,.6)', marginBottom:16 }}>Volume by Category</div>
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <svg width={160} height={160} style={{ flexShrink:0 }}>
                <circle cx={donutCx} cy={donutCy} r={donutR} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={donutStroke} />
                {donutSlices.map((s,i)=>(
                  <circle key={i} cx={donutCx} cy={donutCy} r={donutR} fill="none"
                    stroke={s.color} strokeWidth={donutStroke}
                    strokeDasharray={s.dashArray} strokeDashoffset={s.dashOffset}
                    style={{ transform:'rotate(-90deg)', transformOrigin:`${donutCx}px ${donutCy}px` }} />
                ))}
                <text x={donutCx} y={donutCy-6} textAnchor="middle" fill="white" fontSize={18} fontWeight={700}>42%</text>
                <text x={donutCx} y={donutCy+12} textAnchor="middle" fill="rgba(255,255,255,.35)" fontSize={9}>Crypto</text>
              </svg>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {volumeData.map((d,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:d.color, flexShrink:0 }} />
                    <span style={{ fontSize:12, color:'rgba(255,255,255,.5)', width:56 }}>{d.label}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:'white' }}>{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {card(
        <>
          <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,.6)', marginBottom:20 }}>Win Rate by Category</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {categoryData.map((d,i)=>{
              const rate = (d.wins/d.total)*100;
              return (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'90px 1fr 70px 60px', alignItems:'center', gap:14 }}>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,.7)', fontWeight:500 }}>{d.cat}</div>
                  <div style={{ height:6, background:'rgba(255,255,255,.06)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:rate+'%', borderRadius:3, background:'linear-gradient(90deg,#7c3aed,#06b6d4)', boxShadow:'0 0 8px rgba(124,58,237,.4)' }} />
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,.35)', textAlign:'right' }}>{d.wins}/{d.total}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:rate>=60?'#10b981':rate>=40?'#f59e0b':'#ef4444', textAlign:'right' }}>{rate.toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
type Page = 'markets'|'leaderboard'|'activity'|'analytics'|'create';

const Navbar: FC<{ page:Page; setPage:(p:Page)=>void; octBalance:number; connected:boolean }> = ({ page, setPage, octBalance, connected }) => (
  <header style={{ position:'sticky', top:0, zIndex:50, background:'rgba(6,6,26,.92)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(139,92,246,.15)', fontFamily:"'Space Grotesk',sans-serif" }}>
    <div style={{ maxWidth:1240, margin:'0 auto', padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between', height:58 }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={()=>setPage('markets')}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, boxShadow:'0 0 16px rgba(124,58,237,.5)' }}>🔮</div>
        <span style={{ fontSize:16, fontWeight:700, color:'white', letterSpacing:.5 }}>ORACLE</span>
      </div>
      {/* Nav */}
      <nav style={{ display:'flex', gap:4 }}>
        {([['markets','Markets'],['leaderboard','Leaderboard'],['activity','Activity'],['analytics','Analytics']] as const).map(([p,l])=>(
          <button key={p} onClick={()=>setPage(p)} className={`nav-btn${page===p?' active':''}`} style={{ background:'none', border:'none', padding:'8px 16px', color: page===p?'white':'rgba(255,255,255,.5)', fontSize:14, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", fontWeight: page===p?600:400 }}>{l}</button>
        ))}
      </nav>
      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={()=>setPage('create')} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid rgba(139,92,246,.35)', background:'rgba(139,92,246,.1)', color:'rgba(139,92,246,.9)', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", transition:'all .2s' }}
          onMouseOver={e=>{(e.currentTarget as any).style.background='rgba(139,92,246,.2)'}}
          onMouseOut={e=>{(e.currentTarget as any).style.background='rgba(139,92,246,.1)'}}>
          + Create Market
        </button>
        {connected && octBalance > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(139,92,246,.1)', border:'1px solid rgba(139,92,246,.25)', borderRadius:20, padding:'6px 14px' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 6px #22c55e' }} />
            <span style={{ fontSize:13, fontWeight:600, color:'white' }}>{octBalance.toLocaleString()}</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>OCT</span>
          </div>
        )}
        <WalletMultiButton />
      </div>
    </div>
  </header>
);

// ─── Background ───────────────────────────────────────────────────────────────
const SpaceBg: FC = () => (
  <div style={{ position:'fixed', inset:0, zIndex:-1, background:'linear-gradient(180deg,#06061a 0%,#08082a 50%,#06061a 100%)' }}>
    {Array.from({length:80}).map((_,i)=>(
      <div key={i} style={{ position:'absolute', width: Math.random()*2+.5+'px', height: Math.random()*2+.5+'px', borderRadius:'50%', background:'white', top: Math.random()*100+'%', left: Math.random()*100+'%', opacity: Math.random()*.6+.05, animation:`pulse ${Math.random()*4+2}s ease-in-out ${Math.random()*3}s infinite` }} />
    ))}
    <div style={{ position:'absolute', top:'10%', left:'20%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,.06),transparent 70%)', filter:'blur(80px)' }} />
    <div style={{ position:'absolute', top:'40%', right:'15%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(6,182,212,.04),transparent 70%)', filter:'blur(60px)' }} />
    <div style={{ position:'absolute', bottom:'20%', left:'40%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(245,158,11,.03),transparent 70%)', filter:'blur(50px)' }} />
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
const MainApp: FC = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [page, setPage] = useState<Page>('markets');
  const [octBalance, setOctBalance] = useState(0);

  const fetchOctBalance = useCallback(async () => {
    if (!publicKey) { setOctBalance(0); return; }
    try {
      const { getAssociatedTokenAddress } = await import('@solana/spl-token');
      const ata = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, publicKey);
      const info = await connection.getTokenAccountBalance(ata);
      setOctBalance(Math.floor(info.value.uiAmount || 0));
    } catch { setOctBalance(0); }
  }, [publicKey, connection]);

  useEffect(() => { fetchOctBalance(); }, [fetchOctBalance]);
  useEffect(() => { if (!connected) setOctBalance(0); }, [connected]);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <SpaceBg />
      <Navbar page={page} setPage={setPage} octBalance={octBalance} connected={connected} />
      {page==='markets' && <MarketsPage />}
      {page==='leaderboard' && <LeaderboardPage octBalance={octBalance} />}
      {page==='activity' && <ActivityPage />}
      {page==='analytics' && <AnalyticsPage />}
      {page==='create' && <CreateMarketPage />}
    </>
  );
};

const OracleTokenApp: FC = () => {
  const endpoint = useMemo(()=>HELIUS_RPC,[]);
  const wallets = useMemo(()=>[new PhantomWalletAdapter(), new SolflareWalletAdapter({ network: WalletAdapterNetwork.Devnet })],[]);
  const [splash, setSplash] = useState(true);
  return (
    <>
      {splash && <Splash onDone={()=>setSplash(false)} />}
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <MainApp />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
};

export default OracleTokenApp;
