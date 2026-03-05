import React, { FC, useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import '@solana/wallet-adapter-react-ui/styles.css';

const PROGRAM_ID = new PublicKey("HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj");
const ORACLE_TOKEN_MINT = new PublicKey("6SnhG4g4icbJ2i9U97zEtxkSc6dZ5Z8sCSTtSJH2QuqA");

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: '#09090b',
  surface: '#111113',
  elevated: '#18181b',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.13)',
  text: 'rgba(255,255,255,0.88)',
  textSec: 'rgba(255,255,255,0.42)',
  textMuted: 'rgba(255,255,255,0.2)',
  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.12)',
  green: '#22c55e',
  greenDim: 'rgba(34,197,94,0.1)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.1)',
  purple: '#8b5cf6',
  purpleDim: 'rgba(139,92,246,0.1)',
  sans: "'DM Sans', -apple-system, sans-serif",
  mono: "'DM Mono', 'Fira Mono', monospace",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Crypto', 'Sports', 'Politics', 'Tech', 'Finance'];

const MARKETS = [
  { id: 1, question: "Bitcoin to $100K by end of 2026?", category: "Crypto", yesPercent: 67, volume: "$2.4M", endDate: "Dec 31, 2026", participants: 3421 },
  { id: 2, question: "ETH flips BTC market cap?", category: "Crypto", yesPercent: 23, volume: "$1.2M", endDate: "Dec 31, 2026", participants: 1247 },
  { id: 3, question: "Lakers win NBA Championship?", category: "Sports", yesPercent: 34, volume: "$890K", endDate: "Jun 30, 2026", participants: 892 },
  { id: 4, question: "Fed cuts rates 3+ times in 2026?", category: "Finance", yesPercent: 61, volume: "$2.1M", endDate: "Dec 31, 2026", participants: 2103 },
  { id: 5, question: "Apple Vision Pro 2 announced?", category: "Tech", yesPercent: 91, volume: "$2.2M", endDate: "Sep 30, 2026", participants: 3210 },
  { id: 6, question: "AI companies dominate S&P 500?", category: "Tech", yesPercent: 82, volume: "$1.8M", endDate: "Dec 31, 2026", participants: 2567 },
  { id: 7, question: "Solana reaches $500?", category: "Crypto", yesPercent: 42, volume: "$980K", endDate: "Dec 31, 2026", participants: 723 },
  { id: 8, question: "Republicans win Senate majority?", category: "Politics", yesPercent: 58, volume: "$4.1M", endDate: "Nov 3, 2026", participants: 6789 },
  { id: 9, question: "Tesla stock above $500?", category: "Finance", yesPercent: 47, volume: "$1.3M", endDate: "Dec 31, 2026", participants: 1654 },
  { id: 10, question: "Ethereum 2.0 fully launches?", category: "Crypto", yesPercent: 88, volume: "$3.5M", endDate: "Dec 31, 2026", participants: 4521 },
  { id: 11, question: "Gold above $2,500/oz by Q4?", category: "Finance", yesPercent: 64, volume: "$1.9M", endDate: "Dec 31, 2026", participants: 2341 },
  { id: 12, question: "ChatGPT reaches 1B users?", category: "Tech", yesPercent: 72, volume: "$2.8M", endDate: "Dec 31, 2026", participants: 4123 },
];

const LEADERBOARD = [
  { rank: 1, username: "CryptoOracle", tier: "Oracle", tokens: 45230, winRate: 84, predictions: 287, wins: 241, focus: "Crypto", avatar: "🔮" },
  { rank: 2, username: "SportsGuru", tier: "Oracle", tokens: 38450, winRate: 79, predictions: 312, wins: 246, focus: "Sports", avatar: "⚽" },
  { rank: 3, username: "TechPredictor", tier: "Oracle", tokens: 32890, winRate: 82, predictions: 198, wins: 162, focus: "Tech", avatar: "💻" },
  { rank: 4, username: "FinanceWhiz", tier: "Expert", tokens: 28340, winRate: 77, predictions: 245, wins: 188, focus: "Finance", avatar: "💰" },
  { rank: 5, username: "PoliticsExpert", tier: "Expert", tokens: 24670, winRate: 81, predictions: 189, wins: 153, focus: "Politics", avatar: "🏛️" },
  { rank: 6, username: "BlockchainBet", tier: "Expert", tokens: 21230, winRate: 73, predictions: 276, wins: 201, focus: "Crypto", avatar: "⛓️" },
  { rank: 7, username: "MarketMaven", tier: "Expert", tokens: 18950, winRate: 78, predictions: 167, wins: 130, focus: "Finance", avatar: "📈" },
  { rank: 8, username: "AIEnthusiast", tier: "Expert", tokens: 16780, winRate: 75, predictions: 203, wins: 152, focus: "Tech", avatar: "🤖" },
  { rank: 9, username: "You", tier: "Oracle", tokens: 10850, winRate: 80, predictions: 5, wins: 4, focus: "All", avatar: "👤" },
  { rank: 10, username: "CryptoWhale", tier: "Expert", tokens: 12340, winRate: 76, predictions: 198, wins: 150, focus: "Crypto", avatar: "🐋" },
];

const ACTIVE_BETS = [
  { id: 1, market: "Bitcoin to $100K by end of 2026?", category: "Crypto", side: "Yes", amount: 500, potential: 850, odds: 67, ends: "Dec 31, 2026" },
  { id: 2, market: "Lakers win NBA Championship?", category: "Sports", side: "No", amount: 300, potential: 590, odds: 34, ends: "Jun 30, 2026" },
  { id: 3, market: "Fed cuts rates 3+ times in 2026?", category: "Finance", side: "Yes", amount: 750, potential: 1200, odds: 61, ends: "Dec 31, 2026" },
];

const BET_HISTORY = [
  { id: 1, market: "Trump wins 2024 election?", category: "Politics", side: "Yes", amount: 1000, result: "Won", payout: 1850, date: "Nov 6, 2024", profit: 850 },
  { id: 2, market: "ETH reaches $5K in 2024?", category: "Crypto", side: "Yes", amount: 500, result: "Lost", payout: 0, date: "Dec 31, 2024", profit: -500 },
  { id: 3, market: "Fed rate cut in Sept 2024?", category: "Finance", side: "Yes", amount: 800, result: "Won", payout: 1440, date: "Sep 18, 2024", profit: 640 },
  { id: 4, market: "Bitcoin ETF approved 2024?", category: "Crypto", side: "Yes", amount: 1500, result: "Won", payout: 2100, date: "Jan 10, 2024", profit: 600 },
  { id: 5, market: "Nvidia stock +50% in 2024?", category: "Tech", side: "Yes", amount: 600, result: "Won", payout: 1080, date: "Dec 20, 2024", profit: 480 },
];

// ─── Splash ───────────────────────────────────────────────────────────────────
const SplashScreen: FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<'run' | 'exit'>('run');

  useEffect(() => {
    const duration = 2800;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      setCount(Math.floor(eased * 100));
      if (progress < 1) requestAnimationFrame(tick);
      else { setPhase('exit'); setTimeout(onComplete, 700); }
    };
    requestAnimationFrame(tick);
  }, [onComplete]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: phase === 'exit' ? 0 : 1, transition: 'opacity 0.7s ease', fontFamily: T.mono }}>
      <style>{`
        @keyframes gridPulse { 0%,100%{opacity:.025} 50%{opacity:.06} }
        @keyframes orbFloat { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.15);opacity:.8} }
        @keyframes scanMove { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
      `}</style>

      {/* grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(245,158,11,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,.04) 1px,transparent 1px)', backgroundSize:'48px 48px', animation:'gridPulse 4s ease-in-out infinite' }} />
      {/* amber glow */}
      <div style={{ position:'absolute', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle,rgba(245,158,11,.07) 0%,transparent 70%)', animation:'orbFloat 4s ease-in-out infinite', filter:'blur(40px)' }} />
      {/* scanline */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent,rgba(245,158,11,.4),transparent)', animation:'scanMove 3.5s linear infinite' }} />
      {/* corners */}
      {[[{top:24,left:24},true,true,false,false],[{top:24,right:24},true,false,false,true],[{bottom:24,left:24},false,true,true,false],[{bottom:24,right:24},false,false,true,true]].map(([pos,bt,bl,bb,br]:any, i) => (
        <div key={i} style={{ position:'absolute', ...pos, width:32, height:32, borderTop:bt?`1px solid rgba(245,158,11,.3)`:undefined, borderLeft:bl?`1px solid rgba(245,158,11,.3)`:undefined, borderBottom:bb?`1px solid rgba(245,158,11,.3)`:undefined, borderRight:br?`1px solid rgba(245,158,11,.3)`:undefined }} />
      ))}

      {/* status */}
      <div style={{ position:'absolute', top:36, left:'50%', transform:'translateX(-50%)', display:'flex', gap:20, fontSize:9, letterSpacing:3, color:'rgba(255,255,255,.2)' }}>
        <span>SOLANA_DEVNET</span><span style={{color:'rgba(255,255,255,.08)'}}>|</span>
        <span style={{color:'rgba(245,158,11,.5)'}}>● ONLINE</span>
      </div>

      {/* logo */}
      <div style={{ fontSize:72, marginBottom:20, filter:'drop-shadow(0 0 32px rgba(245,158,11,.7))' }}>🔮</div>
      <div style={{ fontSize:11, letterSpacing:8, color:T.amber, marginBottom:4, opacity:.9 }}>ORACLE TOKEN</div>
      <div style={{ fontSize:9, letterSpacing:4, color:T.textMuted, marginBottom:48 }}>PREDICTION MARKETS · SOLANA</div>

      {/* counter */}
      <div style={{ fontSize:88, fontWeight:100, color:'white', letterSpacing:-6, lineHeight:1, textShadow:`0 0 40px rgba(245,158,11,.3)`, fontVariantNumeric:'tabular-nums' }}>
        {String(count).padStart(3,'0')}
        <span style={{ fontSize:14, letterSpacing:2, color:T.textMuted, marginLeft:4 }}>%</span>
      </div>

      {/* bar */}
      <div style={{ width:240, height:1, background:'rgba(255,255,255,.06)', marginTop:24, position:'relative' }}>
        <div style={{ height:'100%', width:count+'%', background:T.amber, transition:'width .016s linear', boxShadow:`0 0 12px rgba(245,158,11,.6)` }} />
      </div>
      <div style={{ marginTop:14, fontSize:9, letterSpacing:3, color:T.textMuted }}>
        {count < 33 ? 'INITIALIZING' : count < 66 ? 'LOADING MARKETS' : count < 90 ? 'SYNCING ORACLE' : 'READY'}
      </div>

      <div style={{ position:'absolute', bottom:32, fontSize:9, letterSpacing:3, color:'rgba(255,255,255,.08)' }}>PREDICT EVERYTHING</div>
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

  const potential = amount
    ? side === 'yes'
      ? (parseFloat(amount) / (market.yesPercent / 100)).toFixed(0)
      : (parseFloat(amount) / ((100 - market.yesPercent) / 100)).toFixed(0)
    : '0';

  const handleBet = async () => {
    if (!publicKey) { setErr('Connect your wallet first.'); setStatus('error'); return; }
    if (!amount || parseFloat(amount) <= 0) { setErr('Enter a valid amount.'); setStatus('error'); return; }
    setStatus('loading'); setErr('');
    try {
      const { PublicKey: PK, Transaction, SystemProgram } = await import('@solana/web3.js');
      const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
      const idl = (await import('./target/idl/oracle_token.json')).default;
      const { Program, AnchorProvider, BN } = anchor;
      const MARKET_PDA = new PK('CuvChQETTNKYcnDNJwTQccQkQwJpuK8tqv3KWfwB7Jd2');
      const provider = new AnchorProvider(connection, { publicKey, signTransaction: async (tx:any)=>tx, signAllTransactions: async(txs:any)=>txs } as any, { commitment:'confirmed' });
      const program = new Program(idl as any, provider);
      const [predictionPDA] = PK.findProgramAddressSync([Buffer.from('prediction'), publicKey.toBuffer(), MARKET_PDA.toBuffer()], PROGRAM_ID);
      const [userProfile] = PK.findProgramAddressSync([Buffer.from('profile'), publicKey.toBuffer()], PROGRAM_ID);
      const userTokenAccount = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, publicKey);
      const marketVault = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, MARKET_PDA, true);
      const tx = new Transaction();
      if (!await connection.getAccountInfo(userProfile)) {
        tx.add(await (program.methods as any).createUserProfile().accounts({ userProfile, user: publicKey, systemProgram: SystemProgram.programId }).instruction());
      }
      tx.add(await (program.methods as any).makePrediction(side === 'yes' ? 0 : 1, new BN(Math.floor(parseFloat(amount)))).accounts({ prediction: predictionPDA, market: MARKET_PDA, userProfile, user: publicKey, userTokenAccount, marketVault, tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId }).instruction());
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash; tx.feePayer = publicKey;
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      setTxSig(sig); setStatus('success');
    } catch (e: any) { setErr(e?.message || 'Transaction failed.'); setStatus('error'); }
  };

  const overlay: React.CSSProperties = { position:'fixed', inset:0, background:'rgba(0,0,0,.88)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16, fontFamily:T.sans };
  const card: React.CSSProperties = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:28, maxWidth:420, width:'100%' };

  if (status === 'success') return (
    <div style={overlay} onClick={onClose}>
      <div style={{...card, border:`1px solid rgba(34,197,94,.2)`, textAlign:'center'}} onClick={e=>e.stopPropagation()}>
        <div style={{ width:44, height:44, borderRadius:'50%', background:T.greenDim, border:`1px solid rgba(34,197,94,.25)`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:18, color:T.green }}>✓</div>
        <div style={{ fontSize:17, fontWeight:500, color:T.text, marginBottom:6 }}>Prediction Placed</div>
        <div style={{ fontSize:13, color:T.textSec, marginBottom:24 }}>
          You predicted <span style={{ color: side==='yes' ? T.green : '#f97316', fontFamily:T.mono }}>{side.toUpperCase()}</span> on this market
        </div>
        <div style={{ border:`1px solid ${T.border}`, borderRadius:8, padding:'14px 16px', marginBottom:16, textAlign:'left' }}>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:14, lineHeight:1.5 }}>{market.question}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[{l:'Amount',v:parseFloat(amount).toLocaleString()+' OT',c:T.textSec},{l:'Potential Win',v:parseFloat(potential).toLocaleString()+' OT',c:T.green}].map((s,i)=>(
              <div key={i}>
                <div style={{ fontFamily:T.mono, fontSize:9, color:T.textMuted, letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 }}>{s.l}</div>
                <div style={{ fontSize:14, fontWeight:500, color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ border:`1px solid rgba(34,197,94,.12)`, borderRadius:8, padding:'10px 14px', marginBottom:20, background:'rgba(34,197,94,.04)' }}>
          <div style={{ fontFamily:T.mono, fontSize:9, color:'rgba(34,197,94,.5)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:6 }}>Transaction Confirmed</div>
          <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ fontFamily:T.mono, fontSize:11, color:T.purple, textDecoration:'none', wordBreak:'break-all' }}>
            {txSig.slice(0,20)}...{txSig.slice(-8)} ↗
          </a>
        </div>
        <button onClick={onClose} style={{ width:'100%', padding:11, borderRadius:7, border:`1px solid ${T.border}`, background:'rgba(255,255,255,.04)', color:T.textSec, fontSize:13, fontFamily:T.sans, cursor:'pointer' }}>Close</button>
      </div>
    </div>
  );

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e=>e.stopPropagation()}>
        <style>{`.bm-yes:hover{background:rgba(34,197,94,.1)!important;border-color:rgba(34,197,94,.35)!important}.bm-no:hover{background:rgba(249,115,22,.1)!important;border-color:rgba(249,115,22,.35)!important}.bm-chip:hover{background:rgba(255,255,255,.07)!important;color:rgba(255,255,255,.65)!important}.bm-submit:hover:not(:disabled){background:rgba(245,158,11,.12)!important;border-color:rgba(245,158,11,.35)!important;color:${T.amber}!important}`}</style>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:T.mono, fontSize:9, letterSpacing:2.5, color:T.textMuted, textTransform:'uppercase', marginBottom:6 }}>Place Prediction</div>
            <div style={{ fontSize:13, color:T.textSec, lineHeight:1.5, maxWidth:340 }}>{market.question}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:T.textMuted, fontSize:22, cursor:'pointer', paddingLeft:16, lineHeight:1 }}>×</button>
        </div>
        <div style={{ height:1, background:T.border, marginBottom:20 }} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
          {[['yes',T.green,'rgba(34,197,94,.3)',market.yesPercent],['no','#f97316','rgba(249,115,22,.3)',100-market.yesPercent]].map(([s,c,bc,pct]:any)=>(
            <button key={s} className={`bm-${s}`} onClick={()=>setSide(s)} style={{ padding:'12px 8px', borderRadius:8, border:`1px solid ${side===s?bc:T.border}`, background: side===s?`rgba(${s==='yes'?'34,197,94':'249,115,22'},.08)`:'rgba(255,255,255,.02)', color: side===s?c:T.textMuted, fontFamily:T.mono, fontSize:12, letterSpacing:.5, cursor:'pointer', transition:'all .15s' }}>
              {s.toUpperCase()} · {pct}%
            </button>
          ))}
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontFamily:T.mono, fontSize:9, color:T.textMuted, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Amount · OT</div>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" style={{ width:'100%', background:'rgba(255,255,255,.03)', border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 14px', color:'white', fontSize:16, fontFamily:T.mono, outline:'none', boxSizing:'border-box' }} />
          <div style={{ display:'flex', gap:6, marginTop:8 }}>
            {[50,100,250,500].map(n=>(
              <button key={n} className="bm-chip" onClick={()=>setAmount(String(n))} style={{ flex:1, padding:'6px 4px', borderRadius:6, border:`1px solid ${T.border}`, background:'rgba(255,255,255,.02)', color:T.textMuted, fontFamily:T.mono, fontSize:11, cursor:'pointer', transition:'all .15s' }}>{n}</button>
            ))}
          </div>
        </div>

        <div style={{ border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 14px', marginBottom:14 }}>
          {[
            { l:'Prediction', v:`${side.toUpperCase()} @ ${side==='yes'?market.yesPercent:100-market.yesPercent}%`, c: side==='yes'?T.green:'#f97316' },
            { l:'Amount', v:(amount||'0')+' OT', c:T.textSec },
            { l:'Potential Win', v:potential+' OT', c:T.green, sep:true },
          ].map((r,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:r.sep?10:0, marginTop:r.sep?10:0, borderTop:r.sep?`1px solid ${T.border}`:'none', marginBottom:i<2?8:0 }}>
              <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMuted, letterSpacing:.5 }}>{r.l}</span>
              <span style={{ fontFamily:T.mono, fontSize:12, color:r.c, fontWeight:500 }}>{r.v}</span>
            </div>
          ))}
        </div>

        {status==='error' && <div style={{ border:`1px solid rgba(239,68,68,.2)`, borderRadius:7, padding:'9px 13px', marginBottom:12, background:T.redDim, fontSize:12, color:'rgba(239,68,68,.8)', fontFamily:T.sans }}>{err}</div>}

        <button className="bm-submit" onClick={handleBet} disabled={status==='loading'||!amount} style={{ width:'100%', padding:12, borderRadius:8, border:`1px solid ${T.border}`, background:'rgba(255,255,255,.03)', color:T.textSec, fontSize:12, fontFamily:T.mono, cursor:'pointer', transition:'all .15s', letterSpacing:.5, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: (!amount||status==='loading')?.4:1 }}>
          {status==='loading' ? <>
            <svg style={{animation:'spin 1s linear infinite',width:13,height:13}} viewBox="0 0 24 24" fill="none"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            CONFIRMING ON CHAIN
          </> : 'CONFIRM PREDICTION  🔮'}
        </button>
        <div style={{ fontFamily:T.mono, fontSize:9, color:T.textMuted, textAlign:'center', marginTop:10, letterSpacing:.5 }}>DEVNET · ~0.001 SOL FEE</div>
      </div>
    </div>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
const NAV_ITEMS = ['markets','leaderboard','predictions'] as const;
type Page = 'markets' | 'leaderboard' | 'predictions';

const Navbar: FC<{ page: Page; setPage: (p:Page)=>void; balance: number; connected: boolean }> = ({ page, setPage, balance, connected }) => (
  <header style={{ position:'sticky', top:0, zIndex:40, background:`${T.bg}ee`, backdropFilter:'blur(12px)', borderBottom:`1px solid ${T.border}`, fontFamily:T.sans }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap');
      .nav-link{transition:color .15s}
      .nav-link:hover{color:rgba(255,255,255,.75)!important}
      .nav-link.active::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:1px;background:${T.amber}}
      .wallet-adapter-button{background:rgba(255,255,255,.05)!important;border:1px solid ${T.border}!important;border-radius:7px!important;font-family:${T.mono}!important;font-size:11px!important;letter-spacing:.5px!important;color:${T.textSec}!important;padding:7px 13px!important;height:auto!important;font-weight:400!important}
      .wallet-adapter-button:hover{background:rgba(255,255,255,.09)!important;color:${T.text}!important}
      @keyframes spin{to{transform:rotate(360deg)}}
    `}</style>
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between', height:52 }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={()=>setPage('markets')}>
        <span style={{ fontSize:18, filter:'drop-shadow(0 0 8px rgba(245,158,11,.6))' }}>🔮</span>
        <span style={{ fontSize:13, fontWeight:500, color:T.text, letterSpacing:-.2 }}>Oracle Token</span>
        <span style={{ fontFamily:T.mono, fontSize:9, color:T.amber, background:T.amberDim, padding:'2px 6px', borderRadius:4, letterSpacing:1 }}>DEVNET</span>
      </div>

      {/* Nav */}
      <nav style={{ display:'flex', gap:2 }}>
        {NAV_ITEMS.map(p=>(
          <button key={p} onClick={()=>setPage(p)} className={`nav-link${page===p?' active':''}`} style={{ background:'none', border:'none', padding:'6px 14px', borderRadius:6, color: page===p?T.text:T.textSec, fontSize:13, cursor:'pointer', position:'relative', fontFamily:T.sans, textTransform:'capitalize' }}>
            {p}
          </button>
        ))}
      </nav>

      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {connected && (
          <div style={{ fontFamily:T.mono, fontSize:11, color:T.textSec, background:'rgba(255,255,255,.03)', border:`1px solid ${T.border}`, borderRadius:6, padding:'5px 10px' }}>
            <span style={{ color:T.amber }}>{balance.toLocaleString()}</span> OT
          </div>
        )}
        <WalletMultiButton />
      </div>
    </div>
  </header>
);

// ─── Markets Page ─────────────────────────────────────────────────────────────
const MarketsPage: FC = () => {
  const [cat, setCat] = useState('All');
  const [betMarket, setBetMarket] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'volume'|'odds'|'participants'>('volume');

  const filtered = MARKETS
    .filter(m => (cat==='All'||m.category===cat) && m.question.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sort==='volume' ? parseFloat(b.volume.replace(/[$KM]/g,''))*( b.volume.includes('M')?1000:1) - parseFloat(a.volume.replace(/[$KM]/g,''))*( a.volume.includes('M')?1000:1) : sort==='participants' ? b.participants - a.participants : b.yesPercent - a.yesPercent);

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 28px', fontFamily:T.sans }}>
      <style>{`.mkt-row{transition:background .12s}.mkt-row:hover{background:rgba(255,255,255,.025)!important}.mkt-row:hover .bet-btns{opacity:1!important}.bet-btns{transition:opacity .15s}.cat-btn:hover{background:rgba(255,255,255,.06)!important;color:rgba(255,255,255,.7)!important}.sort-btn:hover{color:rgba(255,255,255,.7)!important}`}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:T.amber, boxShadow:`0 0 8px ${T.amber}` }} />
          <span style={{ fontFamily:T.mono, fontSize:10, letterSpacing:2.5, color:T.textMuted, textTransform:'uppercase' }}>Live Markets</span>
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 style={{ fontSize:30, fontWeight:300, color:T.text, letterSpacing:-1.2, margin:0, lineHeight:1.1 }}>
              Prediction Markets <span style={{ color:T.textMuted }}>· {filtered.length}</span>
            </h1>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search markets..." style={{ background:'rgba(255,255,255,.03)', border:`1px solid ${T.border}`, borderRadius:8, padding:'8px 14px', color:T.text, fontSize:13, outline:'none', width:240, fontFamily:T.sans }} />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', gap:4 }}>
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setCat(c)} className="cat-btn" style={{ fontSize:12, padding:'5px 12px', borderRadius:6, border:`1px solid ${T.border}`, background: cat===c?'rgba(255,255,255,.08)':'transparent', color: cat===c?T.text:T.textMuted, cursor:'pointer', fontFamily:T.sans, transition:'all .15s' }}>
              {c}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:12, fontFamily:T.mono, fontSize:10, color:T.textMuted }}>
          <span>Sort by:</span>
          {(['volume','odds','participants'] as const).map(s=>(
            <button key={s} onClick={()=>setSort(s)} className="sort-btn" style={{ background:'none', border:'none', color: sort===s?T.amber:T.textMuted, fontFamily:T.mono, fontSize:10, cursor:'pointer', letterSpacing:.5, padding:0, transition:'color .15s', textTransform:'capitalize' }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 110px 120px 100px 160px', gap:16, padding:'7px 14px', marginBottom:4 }}>
        {['Market','Category','Volume','Participants','Yes Odds',''].map((h,i)=>(
          <div key={i} style={{ fontFamily:T.mono, fontSize:9, color:T.textMuted, letterSpacing:2, textTransform:'uppercase' }}>{h}</div>
        ))}
      </div>

      {/* Table */}
      <div style={{ border:`1px solid ${T.border}`, borderRadius:10, overflow:'hidden' }}>
        {filtered.map((m, idx)=>(
          <div key={m.id} className="mkt-row" style={{ display:'grid', gridTemplateColumns:'1fr 90px 110px 120px 100px 160px', gap:16, padding:'13px 14px', borderBottom: idx<filtered.length-1?`1px solid rgba(255,255,255,.04)`:'none', alignItems:'center', background:'transparent', cursor:'pointer' }}>
            <div>
              <div style={{ fontSize:13, color:T.text, letterSpacing:-.1, marginBottom:3 }}>{m.question}</div>
              <div style={{ fontFamily:T.mono, fontSize:10, color:T.textMuted }}>ends {m.endDate}</div>
            </div>
            <div style={{ fontFamily:T.mono, fontSize:10, padding:'3px 8px', borderRadius:4, background:'rgba(255,255,255,.04)', color:T.textSec, display:'inline-block', letterSpacing:.5 }}>{m.category}</div>
            <div style={{ fontFamily:T.mono, fontSize:12, color:T.textSec }}>{m.volume}</div>
            <div style={{ fontFamily:T.mono, fontSize:12, color:T.textMuted }}>{m.participants.toLocaleString()}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:'100%', height:2, background:'rgba(255,255,255,.06)', borderRadius:1, overflow:'hidden' }}>
                <div style={{ height:'100%', width:m.yesPercent+'%', background:`linear-gradient(90deg,${T.green},rgba(34,197,94,.5))` }} />
              </div>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.green, minWidth:32 }}>{m.yesPercent}%</span>
            </div>
            <div className="bet-btns" style={{ display:'flex', gap:6, opacity:0 }}>
              <button onClick={()=>setBetMarket(m)} style={{ flex:1, padding:'6px 0', borderRadius:6, border:`1px solid rgba(34,197,94,.25)`, background:'rgba(34,197,94,.07)', color:'rgba(34,197,94,.8)', fontFamily:T.mono, fontSize:11, cursor:'pointer', letterSpacing:.5 }}>YES</button>
              <button onClick={()=>setBetMarket(m)} style={{ flex:1, padding:'6px 0', borderRadius:6, border:`1px solid rgba(249,115,22,.25)`, background:'rgba(249,115,22,.07)', color:'rgba(249,115,22,.8)', fontFamily:T.mono, fontSize:11, cursor:'pointer', letterSpacing:.5 }}>NO</button>
            </div>
          </div>
        ))}
      </div>

      {betMarket && <BetModal market={betMarket} onClose={()=>setBetMarket(null)} />}
    </div>
  );
};

// ─── Leaderboard Page ─────────────────────────────────────────────────────────
const LeaderboardPage: FC = () => {
  const [cat, setCat] = useState('All');
  const rows = cat==='All' ? LEADERBOARD : LEADERBOARD.filter(u=>u.focus===cat||u.username==='You');
  const you = LEADERBOARD.find(u=>u.username==='You')!;
  const tierColor = (t:string) => t==='Oracle'?T.amber:t==='Expert'?T.purple:'rgba(96,165,250,.8)';

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 28px', fontFamily:T.sans }}>
      <style>{`.lb-row{transition:background .12s}.lb-row:hover{background:rgba(255,255,255,.025)!important}.lb-cat:hover{background:rgba(255,255,255,.06)!important;color:rgba(255,255,255,.7)!important}`}</style>

      {/* Header */}
      <div style={{ borderBottom:`1px solid ${T.border}`, paddingBottom:28, marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:T.amber, boxShadow:`0 0 8px ${T.amber}` }} />
          <span style={{ fontFamily:T.mono, fontSize:10, letterSpacing:2.5, color:T.textMuted, textTransform:'uppercase' }}>Rankings</span>
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 style={{ fontSize:30, fontWeight:300, color:T.text, letterSpacing:-1.2, margin:0 }}>
              Leaderboard <span style={{ color:T.textMuted }}>· top predictors</span>
            </h1>
            <p style={{ fontSize:13, color:T.textMuted, margin:'8px 0 0', fontWeight:300 }}>Ranked by Oracle Tokens earned</p>
          </div>
          {/* Your card */}
          <div style={{ background:'rgba(255,255,255,.02)', border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 20px', display:'flex', alignItems:'center', gap:20 }}>
            <div>
              <div style={{ fontFamily:T.mono, fontSize:9, color:T.textMuted, letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Your Rank</div>
              <div style={{ fontSize:26, fontWeight:300, color:T.text, letterSpacing:-1 }}>#{you.rank}</div>
            </div>
            <div style={{ width:1, height:36, background:T.border }} />
            {[{l:'Tokens',v:you.tokens.toLocaleString()},{l:'Win Rate',v:you.winRate+'%'},{l:'Predictions',v:String(you.predictions)}].map((s,i)=>(
              <div key={i}>
                <div style={{ fontFamily:T.mono, fontSize:9, color:T.textMuted, letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 }}>{s.l}</div>
                <div style={{ fontSize:15, fontWeight:500, color:T.text, letterSpacing:-.3 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cat filter */}
      <div style={{ display:'flex', gap:4, marginBottom:16 }}>
        {CATEGORIES.map(c=>(
          <button key={c} onClick={()=>setCat(c)} className="lb-cat" style={{ fontSize:12, padding:'5px 12px', borderRadius:6, border:`1px solid ${T.border}`, background: cat===c?'rgba(255,255,255,.08)':'transparent', color: cat===c?T.text:T.textMuted, cursor:'pointer', fontFamily:T.sans, transition:'all .15s' }}>{c}</button>
        ))}
      </div>

      {/* Table header */}
      <div style={{ display:'grid', gridTemplateColumns:'56px 1fr 90px 130px 150px 70px 80px', gap:16, padding:'7px 14px', marginBottom:4 }}>
        {['Rank','User','Tier','Tokens','Win Rate','W/L','Focus'].map((h,i)=>(
          <div key={i} style={{ fontFamily:T.mono, fontSize:9, color:T.textMuted, letterSpacing:2, textTransform:'uppercase' }}>{h}</div>
        ))}
      </div>

      <div style={{ border:`1px solid ${T.border}`, borderRadius:10, overflow:'hidden' }}>
        {rows.map((u,idx)=>(
          <div key={u.rank} className="lb-row" style={{ display:'grid', gridTemplateColumns:'56px 1fr 90px 130px 150px 70px 80px', gap:16, padding:'12px 14px', borderBottom: idx<rows.length-1?`1px solid rgba(255,255,255,.04)`:'none', alignItems:'center', background: u.username==='You'?'rgba(245,158,11,.04)':'transparent', borderLeft: u.username==='You'?`2px solid rgba(245,158,11,.4)`:`2px solid transparent` }}>
            <div style={{ fontFamily:T.mono, fontSize:12, color: idx===0?T.amber:idx===1?'rgba(200,200,200,.6)':idx===2?'rgba(180,120,60,.7)':T.textMuted, fontWeight: idx<3?600:400 }}>
              {idx<3?['01','02','03'][idx]:'#'+u.rank}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:17 }}>{u.avatar}</span>
              <span style={{ fontSize:13, color: u.username==='You'?T.amber:T.text }}>{u.username}</span>
            </div>
            <div style={{ fontFamily:T.mono, fontSize:9, letterSpacing:.5, color:tierColor(u.tier), background: u.tier==='Oracle'?T.amberDim:u.tier==='Expert'?T.purpleDim:'rgba(96,165,250,.08)', padding:'3px 8px', borderRadius:4, display:'inline-block', textTransform:'uppercase' }}>{u.tier}</div>
            <div style={{ fontFamily:T.mono, fontSize:12, color:T.green }}>{u.tokens.toLocaleString()}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textSec, minWidth:32 }}>{u.winRate}%</span>
              <div style={{ flex:1, height:2, background:'rgba(255,255,255,.06)', borderRadius:1, overflow:'hidden' }}>
                <div style={{ height:'100%', width:u.winRate+'%', background:`linear-gradient(90deg,${T.green},rgba(34,197,94,.4))` }} />
              </div>
            </div>
            <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMuted }}>{u.wins}/{u.predictions}</div>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.textMuted }}>{u.focus}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Predictions Page ─────────────────────────────────────────────────────────
const PredictionsPage: FC = () => {
  const [tab, setTab] = useState<'active'|'history'>('active');
  const wins = BET_HISTORY.filter(b=>b.result==='Won').length;
  const totalProfit = BET_HISTORY.reduce((s,b)=>s+b.profit,0);

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 28px', fontFamily:T.sans }}>
      <style>{`.pred-row{transition:background .12s}.pred-row:hover{background:rgba(255,255,255,.025)!important}.tab-btn{transition:color .15s}`}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:T.amber, boxShadow:`0 0 8px ${T.amber}` }} />
          <span style={{ fontFamily:T.mono, fontSize:10, letterSpacing:2.5, color:T.textMuted, textTransform:'uppercase' }}>My Predictions</span>
        </div>
        <h1 style={{ fontSize:30, fontWeight:300, color:T.text, letterSpacing:-1.2, margin:'0 0 20px' }}>Activity</h1>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:0 }}>
          {[
            { l:'Active Bets', v:ACTIVE_BETS.length, c:T.text },
            { l:'Total Resolved', v:BET_HISTORY.length, c:T.text },
            { l:'Win Rate', v:((wins/BET_HISTORY.length)*100).toFixed(0)+'%', c:T.green },
            { l:'Total P&L', v:(totalProfit>0?'+':'')+totalProfit.toLocaleString()+' OT', c:totalProfit>=0?T.green:T.red },
          ].map((s,i)=>(
            <div key={i} style={{ background:'rgba(255,255,255,.02)', border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 18px' }}>
              <div style={{ fontFamily:T.mono, fontSize:9, color:T.textMuted, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>{s.l}</div>
              <div style={{ fontSize:22, fontWeight:300, color:s.c, letterSpacing:-1 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${T.border}`, marginBottom:20 }}>
        {[['active','Active ('+ACTIVE_BETS.length+')'],['history','History ('+BET_HISTORY.length+')']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t as any)} className="tab-btn" style={{ padding:'10px 20px', background:'none', border:'none', color: tab===t?T.text:T.textMuted, fontSize:13, cursor:'pointer', fontFamily:T.sans, borderBottom: tab===t?`1px solid ${T.amber}`:'1px solid transparent', marginBottom:-1 }}>{l}</button>
        ))}
      </div>

      {/* Active */}
      {tab==='active' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 70px 90px 110px 100px 110px', gap:16, padding:'7px 14px', marginBottom:4 }}>
            {['Market','Side','Amount','Potential','Odds','Ends'].map((h,i)=>(
              <div key={i} style={{ fontFamily:T.mono, fontSize:9, color:T.textMuted, letterSpacing:2, textTransform:'uppercase' }}>{h}</div>
            ))}
          </div>
          <div style={{ border:`1px solid ${T.border}`, borderRadius:10, overflow:'hidden' }}>
            {ACTIVE_BETS.map((b,idx)=>(
              <div key={b.id} className="pred-row" style={{ display:'grid', gridTemplateColumns:'1fr 70px 90px 110px 100px 110px', gap:16, padding:'13px 14px', borderBottom: idx<ACTIVE_BETS.length-1?`1px solid rgba(255,255,255,.04)`:'none', alignItems:'center', background:'transparent' }}>
                <div>
                  <div style={{ fontSize:13, color:T.text, marginBottom:2 }}>{b.market}</div>
                  <div style={{ fontFamily:T.mono, fontSize:10, color:T.textMuted }}>{b.category}</div>
                </div>
                <div style={{ fontFamily:T.mono, fontSize:10, padding:'3px 8px', borderRadius:4, background: b.side==='Yes'?T.greenDim:T.redDim, color: b.side==='Yes'?T.green:T.red, display:'inline-block', textTransform:'uppercase' }}>{b.side}</div>
                <div style={{ fontFamily:T.mono, fontSize:12, color:T.textSec }}>{b.amount} OT</div>
                <div style={{ fontFamily:T.mono, fontSize:12, color:T.green }}>{b.potential} OT</div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ flex:1, height:2, background:'rgba(255,255,255,.06)', borderRadius:1, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:b.odds+'%', background:`linear-gradient(90deg,${T.green},rgba(34,197,94,.4))` }} />
                  </div>
                  <span style={{ fontFamily:T.mono, fontSize:10, color:T.textSec }}>{b.odds}%</span>
                </div>
                <div style={{ fontFamily:T.mono, fontSize:10, color:T.textMuted }}>{b.ends}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* History */}
      {tab==='history' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 70px 90px 80px 100px 90px', gap:16, padding:'7px 14px', marginBottom:4 }}>
            {['Market','Side','Amount','Result','Payout','P&L'].map((h,i)=>(
              <div key={i} style={{ fontFamily:T.mono, fontSize:9, color:T.textMuted, letterSpacing:2, textTransform:'uppercase' }}>{h}</div>
            ))}
          </div>
          <div style={{ border:`1px solid ${T.border}`, borderRadius:10, overflow:'hidden' }}>
            {BET_HISTORY.map((b,idx)=>(
              <div key={b.id} className="pred-row" style={{ display:'grid', gridTemplateColumns:'1fr 70px 90px 80px 100px 90px', gap:16, padding:'13px 14px', borderBottom: idx<BET_HISTORY.length-1?`1px solid rgba(255,255,255,.04)`:'none', alignItems:'center', background:'transparent' }}>
                <div>
                  <div style={{ fontSize:13, color:T.text, marginBottom:2 }}>{b.market}</div>
                  <div style={{ fontFamily:T.mono, fontSize:10, color:T.textMuted }}>{b.category} · {b.date}</div>
                </div>
                <div style={{ fontFamily:T.mono, fontSize:10, padding:'3px 8px', borderRadius:4, background: b.side==='Yes'?T.greenDim:T.redDim, color: b.side==='Yes'?T.green:T.red, display:'inline-block', textTransform:'uppercase' }}>{b.side}</div>
                <div style={{ fontFamily:T.mono, fontSize:12, color:T.textSec }}>{b.amount} OT</div>
                <div style={{ fontFamily:T.mono, fontSize:10, padding:'3px 8px', borderRadius:4, background: b.result==='Won'?T.greenDim:T.redDim, color: b.result==='Won'?T.green:T.red, display:'inline-block' }}>{b.result}</div>
                <div style={{ fontFamily:T.mono, fontSize:12, color: b.result==='Won'?T.green:T.textMuted }}>{b.result==='Won'?b.payout+' OT':'—'}</div>
                <div style={{ fontFamily:T.mono, fontSize:13, color: b.profit>0?T.green:T.red, letterSpacing:-.3 }}>{b.profit>0?'+':''}{b.profit}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const MainApp: FC = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [page, setPage] = useState<Page>('markets');
  const [balance, setBalance] = useState(10850);

  useEffect(() => {
    if (connected && publicKey) {
      connection.getBalance(publicKey).then(b => { void b; });
      setBalance(10850);
    }
  }, [connected, publicKey, connection]);

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text }}>
      <Navbar page={page} setPage={setPage} balance={balance} connected={connected} />
      {page==='markets' && <MarketsPage />}
      {page==='leaderboard' && <LeaderboardPage />}
      {page==='predictions' && <PredictionsPage />}
    </div>
  );
};

const OracleTokenApp: FC = () => {
  const endpoint = useMemo(() => 'https://devnet.helius-rpc.com/?api-key=bb6da2ff-6316-4784-9ef8-53de07864e95', []);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network: WalletAdapterNetwork.Devnet })], []);
  const [splash, setSplash] = useState(true);

  return (
    <>
      {splash && <SplashScreen onComplete={() => setSplash(false)} />}
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
