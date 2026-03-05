import React, { FC, useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import '@solana/wallet-adapter-react-ui/styles.css';
import { TokenBalance } from './TokenBalance';

// Program ID
const PROGRAM_ID = new PublicKey("HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj");
const ORACLE_TOKEN_MINT = new PublicKey("6SnhG4g4icbJ2i9U97zEtxkSc6dZ5Z8sCSTtSJH2QuqA");

// Market categories with colors
const CATEGORIES = [
  { name: 'All', color: 'from-blue-500 to-purple-600' },
  { name: 'Crypto', color: 'from-orange-500 to-yellow-500' },
  { name: 'Sports', color: 'from-green-500 to-emerald-600' },
  { name: 'Politics', color: 'from-red-500 to-pink-600' },
  { name: 'Tech', color: 'from-cyan-500 to-blue-600' },
  { name: 'Finance', color: 'from-purple-500 to-indigo-600' },
];

// Featured markets
const FEATURED_MARKETS = [
  {
    id: 101,
    title: "Bitcoin to $100K in 2026?",
    description: "Will Bitcoin reach $100,000 by end of 2026?",
    category: "Crypto",
    image: "₿",
    color: "from-orange-400 to-yellow-500",
    volume: "$2.4M",
    yesPercent: 67,
    question: "Will Bitcoin reach $100,000 by end of 2026?",
    endDate: "Dec 31, 2026",
    participants: 3421
  },
  {
    id: 102,
    title: "AI Dominates Tech",
    description: "Will AI companies dominate market cap?",
    category: "Tech",
    image: "🤖",
    color: "from-green-400 to-emerald-500",
    volume: "$1.8M",
    yesPercent: 82,
    question: "Will AI companies dominate market cap?",
    endDate: "Dec 31, 2026",
    participants: 2567
  },
  {
    id: 103,
    title: "2026 Elections",
    description: "Predict the election outcomes",
    category: "Politics",
    image: "🗳️",
    color: "from-blue-400 to-cyan-500",
    volume: "$3.2M",
    yesPercent: 45,
    question: "Will Democrats win 2026 midterms?",
    endDate: "Nov 3, 2026",
    participants: 5234
  },
  {
    id: 104,
    title: "Oracle Token Growth",
    description: "Will Oracle Token reach 100K users?",
    category: "Crypto",
    image: "🔮",
    color: "from-purple-400 to-pink-500",
    volume: "$890K",
    yesPercent: 73,
    question: "Will Oracle Token reach 100K users?",
    endDate: "Dec 31, 2026",
    participants: 1892
  },
];

// Sample active markets - EXPANDED LIST
const SAMPLE_MARKETS = [
  { id: 1, question: "ETH to flip BTC market cap?", category: "Crypto", yesPercent: 23, volume: "$1.2M", endDate: "Dec 31, 2026", participants: 1247 },
  { id: 2, question: "Lakers win NBA Championship?", category: "Sports", yesPercent: 34, volume: "$890K", endDate: "Jun 30, 2026", participants: 892 },
  { id: 3, question: "Fed cuts rates 3+ times?", category: "Finance", yesPercent: 61, volume: "$2.1M", endDate: "Dec 31, 2026", participants: 2103 },
  { id: 4, question: "New iPhone sales record?", category: "Tech", yesPercent: 78, volume: "$1.5M", endDate: "Sep 30, 2026", participants: 1456 },
  { id: 5, question: "Solana reaches $500?", category: "Crypto", yesPercent: 42, volume: "$980K", endDate: "Dec 31, 2026", participants: 723 },
  { id: 6, question: "Major tech merger announced?", category: "Tech", yesPercent: 55, volume: "$1.1M", endDate: "Jun 30, 2026", participants: 934 },
  // NEW MARKETS
  { id: 7, question: "Ethereum 2.0 fully launches?", category: "Crypto", yesPercent: 88, volume: "$3.5M", endDate: "Dec 31, 2026", participants: 4521 },
  { id: 8, question: "Warriors win NBA title?", category: "Sports", yesPercent: 41, volume: "$1.8M", endDate: "Jun 30, 2026", participants: 2134 },
  { id: 9, question: "US unemployment below 3%?", category: "Finance", yesPercent: 52, volume: "$920K", endDate: "Dec 31, 2026", participants: 876 },
  { id: 10, question: "Apple Vision Pro 2 announced?", category: "Tech", yesPercent: 91, volume: "$2.2M", endDate: "Sep 30, 2026", participants: 3210 },
  { id: 11, question: "Dogecoin reaches $1?", category: "Crypto", yesPercent: 15, volume: "$650K", endDate: "Dec 31, 2026", participants: 1892 },
  { id: 12, question: "Republicans win Senate?", category: "Politics", yesPercent: 58, volume: "$4.1M", endDate: "Nov 3, 2026", participants: 6789 },
  { id: 13, question: "Tesla stock above $500?", category: "Finance", yesPercent: 47, volume: "$1.3M", endDate: "Dec 31, 2026", participants: 1654 },
  { id: 14, question: "Super Bowl in Las Vegas?", category: "Sports", yesPercent: 100, volume: "$890K", endDate: "Feb 14, 2027", participants: 543 },
  { id: 15, question: "ChatGPT reaches 1B users?", category: "Tech", yesPercent: 72, volume: "$2.8M", endDate: "Dec 31, 2026", participants: 4123 },
  { id: 16, question: "Cardano reaches $5?", category: "Crypto", yesPercent: 31, volume: "$780K", endDate: "Dec 31, 2026", participants: 987 },
  { id: 17, question: "Gold price above $2500/oz?", category: "Finance", yesPercent: 64, volume: "$1.9M", endDate: "Dec 31, 2026", participants: 2341 },
  { id: 18, question: "Paris Olympics most watched?", category: "Sports", yesPercent: 83, volume: "$1.1M", endDate: "Aug 15, 2026", participants: 1876 },
  { id: 19, question: "Biden runs for reelection?", category: "Politics", yesPercent: 22, volume: "$5.2M", endDate: "Jun 1, 2026", participants: 8901 },
  { id: 20, question: "Meta releases VR headset?", category: "Tech", yesPercent: 95, volume: "$1.6M", endDate: "Oct 31, 2026", participants: 2567 },
];

// Mock user prediction history
const MOCK_ACTIVE_PREDICTIONS = [
  { id: 1, market: "Bitcoin to $100K in 2026?", category: "Crypto", betSide: "Yes", amount: 500, potentialWin: 850, endDate: "Dec 31, 2026", currentOdds: 67, placedDate: "Jan 15, 2026" },
  { id: 2, market: "Lakers win NBA Championship?", category: "Sports", betSide: "No", amount: 300, potentialWin: 590, endDate: "Jun 30, 2026", currentOdds: 34, placedDate: "Jan 20, 2026" },
  { id: 3, market: "Fed cuts rates 3+ times?", category: "Finance", betSide: "Yes", amount: 750, potentialWin: 1200, endDate: "Dec 31, 2026", currentOdds: 61, placedDate: "Feb 1, 2026" },
];

const MOCK_PREDICTION_HISTORY = [
  { id: 1, market: "Trump wins 2024 election?", category: "Politics", betSide: "Yes", amount: 1000, result: "Won", payout: 1850, date: "Nov 6, 2024", profit: 850 },
  { id: 2, market: "ETH reaches $5K in 2024?", category: "Crypto", betSide: "Yes", amount: 500, result: "Lost", payout: 0, date: "Dec 31, 2024", profit: -500 },
  { id: 3, market: "Warriors win NBA 2024?", category: "Sports", betSide: "No", amount: 300, result: "Won", payout: 520, date: "Jun 15, 2024", profit: 220 },
  { id: 4, market: "Fed rate cut in Sept 2024?", category: "Finance", betSide: "Yes", amount: 800, result: "Won", payout: 1440, date: "Sep 18, 2024", profit: 640 },
  { id: 5, market: "Bitcoin ETF approved 2024?", category: "Crypto", betSide: "Yes", amount: 1500, result: "Won", payout: 2100, date: "Jan 10, 2024", profit: 600 },
  { id: 6, market: "Nvidia stock +50% in 2024?", category: "Tech", betSide: "Yes", amount: 600, result: "Won", payout: 1080, date: "Dec 20, 2024", profit: 480 },
  { id: 7, market: "Super Bowl winner Chiefs?", category: "Sports", betSide: "No", amount: 400, result: "Lost", payout: 0, date: "Feb 11, 2024", profit: -400 },
  { id: 8, market: "Inflation below 3% by Q4?", category: "Finance", betSide: "Yes", amount: 900, result: "Won", payout: 1620, date: "Oct 30, 2024", profit: 720 },
];

const CATEGORY_REPUTATION = [
  { category: "Crypto", wins: 15, total: 20, tokens: 3200, accuracy: 75 },
  { category: "Sports", wins: 8, total: 12, tokens: 1800, accuracy: 67 },
  { category: "Politics", wins: 12, total: 15, tokens: 2600, accuracy: 80 },
  { category: "Tech", wins: 6, total: 10, tokens: 1200, accuracy: 60 },
  { category: "Finance", wins: 10, total: 14, tokens: 2100, accuracy: 71 },
];

// Leaderboard Data
const LEADERBOARD_DATA = [
  { rank: 1, username: "CryptoOracle", tier: "Oracle", totalTokens: 45230, winRate: 84, totalPredictions: 287, wins: 241, category: "Crypto", avatar: "🔮" },
  { rank: 2, username: "SportsGuru", tier: "Oracle", totalTokens: 38450, winRate: 79, totalPredictions: 312, wins: 246, category: "Sports", avatar: "⚽" },
  { rank: 3, username: "TechPredictor", tier: "Oracle", totalTokens: 32890, winRate: 82, totalPredictions: 198, wins: 162, category: "Tech", avatar: "💻" },
  { rank: 4, username: "FinanceWhiz", tier: "Expert", totalTokens: 28340, winRate: 77, totalPredictions: 245, wins: 188, category: "Finance", avatar: "💰" },
  { rank: 5, username: "PoliticsExpert", tier: "Expert", totalTokens: 24670, winRate: 81, totalPredictions: 189, wins: 153, category: "Politics", avatar: "🏛️" },
  { rank: 6, username: "BlockchainBet", tier: "Expert", totalTokens: 21230, winRate: 73, totalPredictions: 276, wins: 201, category: "Crypto", avatar: "⛓️" },
  { rank: 7, username: "MarketMaven", tier: "Expert", totalTokens: 18950, winRate: 78, totalPredictions: 167, wins: 130, category: "Finance", avatar: "📈" },
  { rank: 8, username: "AIEnthusiast", tier: "Expert", totalTokens: 16780, winRate: 75, totalPredictions: 203, wins: 152, category: "Tech", avatar: "🤖" },
  { rank: 9, username: "BasketballFan", tier: "Expert", totalTokens: 14560, winRate: 71, totalPredictions: 234, wins: 166, category: "Sports", avatar: "🏀" },
  { rank: 10, username: "You", tier: "Oracle", totalTokens: 10850, winRate: 80, totalPredictions: 5, wins: 4, category: "All", avatar: "👤" },
  { rank: 11, username: "CryptoWhale", tier: "Expert", totalTokens: 12340, winRate: 76, totalPredictions: 198, wins: 150, category: "Crypto", avatar: "🐋" },
  { rank: 12, username: "PoliticalWiz", tier: "Expert", totalTokens: 11890, winRate: 74, totalPredictions: 215, wins: 159, category: "Politics", avatar: "🎯" },
  { rank: 13, username: "TechSavvy", tier: "Basic", totalTokens: 9560, winRate: 69, totalPredictions: 178, wins: 122, category: "Tech", avatar: "⚡" },
  { rank: 14, username: "MoneyMaker", tier: "Basic", totalTokens: 8230, winRate: 72, totalPredictions: 156, wins: 112, category: "Finance", avatar: "💵" },
  { rank: 15, username: "SportsBet", tier: "Basic", totalTokens: 7450, winRate: 68, totalPredictions: 189, wins: 128, category: "Sports", avatar: "🎾" },
];

// Mock price history for charts
const MOCK_PRICE_HISTORY = [
  { date: 'Jan 1', yesPercent: 50 },
  { date: 'Jan 8', yesPercent: 52 },
  { date: 'Jan 15', yesPercent: 55 },
  { date: 'Jan 22', yesPercent: 58 },
  { date: 'Jan 29', yesPercent: 61 },
  { date: 'Feb 5', yesPercent: 63 },
  { date: 'Feb 12', yesPercent: 65 },
  { date: 'Feb 16', yesPercent: 67 },
];

// Mock top predictors
const MOCK_TOP_PREDICTORS = [
  { username: "CryptoOracle", avatar: "🔮", betSide: "Yes", amount: 5000, potentialWin: 8500 },
  { username: "BlockchainBet", avatar: "⛓️", betSide: "Yes", amount: 3200, potentialWin: 5440 },
  { username: "TechPredictor", avatar: "💻", betSide: "No", amount: 2800, potentialWin: 5600 },
  { username: "MarketMaven", avatar: "📈", betSide: "Yes", amount: 2100, potentialWin: 3570 },
  { username: "AIEnthusiast", avatar: "🤖", betSide: "No", amount: 1900, potentialWin: 3800 },
];

// Mock comments
const MOCK_COMMENTS = [
  { id: 1, username: "CryptoOracle", avatar: "🔮", comment: "BTC halving + ETF inflows = inevitable $100K. History doesn't lie.", time: "2 hours ago", likes: 24 },
  { id: 2, username: "TechPredictor", avatar: "💻", comment: "Too optimistic IMO. Macro headwinds and regulatory pressure will cap gains.", time: "5 hours ago", likes: 12 },
  { id: 3, username: "BlockchainBet", avatar: "⛓️", comment: "On-chain metrics looking bullish. Long-term holders accumulating.", time: "1 day ago", likes: 18 },
  { id: 4, username: "MarketMaven", avatar: "📈", comment: "Stock-to-flow model suggests $120K+ is possible by year-end.", time: "2 days ago", likes: 31 },
];



const SplashScreen: FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<'counting' | 'reveal' | 'exit'>('counting');
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    let start = 0;
    const duration = 3000;
    const increment = 100 / (duration / 16);
    const counter = setInterval(() => {
      start += increment;
      if (start >= 100) {
        setCount(100);
        clearInterval(counter);
        setGlitch(true);
        setTimeout(() => setGlitch(false), 400);
        setPhase('reveal');
        setTimeout(() => { setPhase('exit'); setTimeout(onComplete, 1000); }, 1200);
      } else {
        setCount(Math.floor(start));
        if (Math.random() < 0.05) { setGlitch(true); setTimeout(() => setGlitch(false), 80); }
      }
    }, 16);
    return () => clearInterval(counter);
  }, [onComplete]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000005', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', transition: phase === 'exit' ? 'opacity 1s ease' : 'none', opacity: phase === 'exit' ? 0 : 1, overflow: 'hidden', fontFamily: 'monospace' }}>
      
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; } 92% { opacity: 1; } 93% { opacity: 0.4; } 95% { opacity: 1; } 97% { opacity: 0.6; } 98% { opacity: 1; }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.03; } 50% { opacity: 0.07; }
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(2deg); }
        }
        @keyframes glitchAnim {
          0% { clip-path: inset(0 0 95% 0); transform: translate(-4px, 0); }
          10% { clip-path: inset(30% 0 50% 0); transform: translate(4px, 0); }
          20% { clip-path: inset(60% 0 20% 0); transform: translate(-2px, 0); }
          30% { clip-path: inset(10% 0 80% 0); transform: translate(2px, 0); }
          40% { clip-path: inset(80% 0 5% 0); transform: translate(-4px, 0); }
          100% { clip-path: inset(0 0 0 0); transform: translate(0, 0); }
        }
        @keyframes ringExpand {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes dataStream {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-100px); opacity: 0; }
        }
        .glitch-text::before {
          content: attr(data-text);
          position: absolute;
          left: 0; top: 0; right: 0;
          color: #0ff;
          animation: glitchAnim 0.15s infinite;
          opacity: 0.7;
        }
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          left: 0; top: 0; right: 0;
          color: #f0f;
          animation: glitchAnim 0.15s infinite reverse;
          opacity: 0.5;
        }
      `}</style>

      {/* Grid background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px', animation: 'gridPulse 4s ease-in-out infinite' }} />

      {/* Horizon glow */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '300px', background: 'linear-gradient(to top, rgba(139,92,246,0.15), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '0px', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.8), rgba(236,72,153,0.8), transparent)', boxShadow: '0 0 20px rgba(139,92,246,0.5)' }} />

      {/* Scanline effect */}
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)', pointerEvents: 'none', zIndex: 10 }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)', animation: 'scanline 4s linear infinite', zIndex: 11 }} />

      {/* Corner decorations */}
      {[{top:20,left:20}, {top:20,right:20}, {bottom:20,left:20}, {bottom:20,right:20}].map((pos, i) => (
        <div key={i} style={{ position: 'absolute', ...pos, width: '40px', height: '40px', borderTop: i < 2 ? '1px solid rgba(139,92,246,0.5)' : 'none', borderBottom: i >= 2 ? '1px solid rgba(139,92,246,0.5)' : 'none', borderLeft: i % 2 === 0 ? '1px solid rgba(139,92,246,0.5)' : 'none', borderRight: i % 2 === 1 ? '1px solid rgba(139,92,246,0.5)' : 'none' }} />
      ))}

      {/* Expanding rings */}
      {phase === 'reveal' && [0,1,2].map(i => (
        <div key={i} style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', border: '1px solid rgba(139,92,246,0.4)', animation: `ringExpand 1.5s ease-out ${i * 0.3}s forwards` }} />
      ))}

      {/* Ambient orbs */}
      <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', animation: 'orbPulse 3s ease-in-out infinite', filter: 'blur(30px)' }} />
      <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)', animation: 'orbPulse 4s ease-in-out infinite reverse', filter: 'blur(20px)', transform: 'translate(100px, 50px)' }} />

      {/* Status lines top */}
      <div style={{ position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '24px', fontSize: '9px', letterSpacing: '3px', color: 'rgba(139,92,246,0.5)' }}>
        <span>SOLANA_DEVNET</span>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
        <span>SYS_INIT</span>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
        <span style={{ color: 'rgba(0,255,200,0.6)' }}>● ONLINE</span>
      </div>

      {/* Main crystal ball */}
      <div style={{ fontSize: '90px', marginBottom: '24px', animation: 'float 4s ease-in-out infinite', filter: `drop-shadow(0 0 40px rgba(139,92,246,0.9)) drop-shadow(0 0 80px rgba(139,92,246,0.4))`, position: 'relative', zIndex: 5 }}>🔮</div>

      {/* Oracle Token title with glitch */}
      <div style={{ position: 'relative', marginBottom: '8px' }} className={glitch ? 'glitch-text' : ''} data-text="ORACLE TOKEN">
        <div style={{ fontSize: '13px', letterSpacing: '8px', color: glitch ? '#0ff' : 'rgba(255,255,255,0.9)', textTransform: 'uppercase', fontWeight: 300, transition: 'color 0.1s', textShadow: phase === 'reveal' ? '0 0 20px rgba(139,92,246,1)' : 'none' }}>
          ORACLE TOKEN
        </div>
      </div>

      <div style={{ fontSize: '9px', letterSpacing: '4px', color: 'rgba(139,92,246,0.5)', marginBottom: '52px', textTransform: 'uppercase' }}>
        PREDICTION MARKETS // SOLANA
      </div>

      {/* Big counter */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <div style={{ fontSize: '96px', fontWeight: 100, color: glitch ? '#0ff' : 'white', letterSpacing: '-6px', lineHeight: 1, textShadow: phase === 'reveal' ? '0 0 30px rgba(139,92,246,1), 0 0 60px rgba(139,92,246,0.5)' : '0 0 10px rgba(255,255,255,0.2)', transition: 'text-shadow 0.3s, color 0.1s', fontVariantNumeric: 'tabular-nums' }}>
          {String(count).padStart(3, '0')}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', marginBottom: '8px' }}>%</div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '280px', height: '2px', background: 'rgba(255,255,255,0.05)', marginTop: '20px', position: 'relative', overflow: 'visible' }}>
        <div style={{ height: '100%', width: count + '%', background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', transition: 'width 0.016s linear', boxShadow: '0 0 12px rgba(139,92,246,0.8), 0 0 24px rgba(236,72,153,0.4)', position: 'relative' }}>
          <div style={{ position: 'absolute', right: 0, top: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899', boxShadow: '0 0 8px #ec4899' }} />
        </div>
      </div>

      {/* Loading text */}
      <div style={{ marginTop: '20px', fontSize: '9px', letterSpacing: '3px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
        {count < 30 ? 'INITIALIZING BLOCKCHAIN' : count < 60 ? 'LOADING MARKETS' : count < 90 ? 'SYNCING ORACLE DATA' : 'READY'}
      </div>

      {/* Bottom status */}
      <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', letterSpacing: '2px', color: 'rgba(255,255,255,0.15)' }}>
        PREDICT EVERYTHING
      </div>
    </div>
  );
};

const OracleTokenApp: FC = () => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })], [network]);

  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
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

const MainApp: FC = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [oracleBalance, setOracleBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [userTier, setUserTier] = useState('Novice');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'leaderboard' | 'predictions' | 'create' | 'market-details' | 'all-markets'>('home');
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);

  useEffect(() => {
    if (connected && publicKey) {
      connection.getBalance(publicKey).then(bal => setSolBalance(bal / LAMPORTS_PER_SOL));
      setOracleBalance(10850);
      
      if (oracleBalance >= 10000) setUserTier('Oracle');
      else if (oracleBalance >= 1000) setUserTier('Expert');
      else if (oracleBalance >= 100) setUserTier('Basic');
      else setUserTier('Novice');
    }
  }, [connected, publicKey, connection, oracleBalance]);

  const filteredMarkets = selectedCategory === 'All' 
    ? SAMPLE_MARKETS 
    : SAMPLE_MARKETS.filter(m => m.category === selectedCategory);

  const canCreateMarket = oracleBalance >= 1000;

  const handleMarketClick = (marketId: number) => {
    setSelectedMarketId(marketId);
    setCurrentPage('market-details');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1929] via-[#0d2137] to-[#0a1929]">
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50, fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`
          .nav-btn { transition: color 0.15s ease; }
          .nav-btn:hover { color: rgba(255,255,255,0.8) !important; }
          .nav-btn.active { color: rgba(255,255,255,0.9) !important; }
          .nav-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.6); }
          .create-btn { transition: all 0.15s ease; }
          .create-btn:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.15) !important; color: rgba(255,255,255,0.8) !important; }
          .wallet-btn-wrap .wallet-adapter-button { background: rgba(255,255,255,0.06) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 7px !important; font-family: 'DM Mono', monospace !important; font-size: 11px !important; letter-spacing: 0.5px !important; color: rgba(255,255,255,0.6) !important; padding: 8px 14px !important; height: auto !important; font-weight: 400 !important; }
          .wallet-btn-wrap .wallet-adapter-button:hover { background: rgba(255,255,255,0.1) !important; color: rgba(255,255,255,0.9) !important; }
          .token-bal { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 7px; padding: 6px 12px; display: flex; align-items: center; gap: 7px; }
        `}</style>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo + nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div onClick={() => setCurrentPage('home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <span style={{ fontSize: '16px' }}>🔮</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.2px' }}>Oracle Token</span>
            </div>

            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)' }} />

            <nav style={{ display: 'flex', alignItems: 'stretch', gap: '0', height: '52px' }}>
              {[
                { label: 'Trending', page: 'home' },
                { label: 'Markets', page: 'all-markets' },
                { label: 'Leaderboard', page: 'leaderboard' },
                { label: 'My Predictions', page: 'predictions' },
              ].map(({ label, page }) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as any)}
                  className={`nav-btn ${currentPage === page ? 'active' : ''}`}
                  style={{ position: 'relative', background: 'none', border: 'none', padding: '0 14px', fontSize: '13px', color: currentPage === page ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {connected && canCreateMarket && (
              <button onClick={() => setCurrentPage('create' as any)} className="create-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', padding: '7px 12px', color: 'rgba(255,255,255,0.45)', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>
                <span style={{ fontSize: '11px' }}>+</span>
                <span>Create Market</span>
              </button>
            )}

            <div className="token-bal">
              <span style={{ fontSize: '14px' }}>🔮</span>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.2px', lineHeight: 1.2 }}><TokenBalance /></div>
              </div>
            </div>

            <div className="wallet-btn-wrap">
              <WalletMultiButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {currentPage === 'home' && (
        <div style={{ fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@300;400;500&display=swap');
            .market-row { transition: background 0.15s ease, border-color 0.15s ease; }
            .market-row:hover { background: rgba(255,255,255,0.03) !important; border-color: rgba(255,255,255,0.12) !important; }
            .cat-pill { transition: all 0.15s ease; }
            .cat-pill:hover { background: rgba(255,255,255,0.06) !important; color: white !important; }
            .cat-pill.active { background: rgba(255,255,255,0.1) !important; color: white !important; border-color: rgba(255,255,255,0.2) !important; }
            .yes-btn { transition: all 0.15s ease; }
            .yes-btn:hover { background: rgba(34,197,94,0.15) !important; border-color: rgba(34,197,94,0.4) !important; color: rgb(34,197,94) !important; }
            .no-btn { transition: all 0.15s ease; }
            .no-btn:hover { background: rgba(249,115,22,0.15) !important; border-color: rgba(249,115,22,0.4) !important; color: rgb(249,115,22) !important; }
            .featured-card { transition: all 0.2s ease; border: 1px solid rgba(255,255,255,0.06); }
            .featured-card:hover { border-color: rgba(255,255,255,0.14) !important; transform: translateY(-2px); }
            .view-all-btn { transition: all 0.15s ease; }
            .view-all-btn:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.15) !important; }
          `}</style>

          {/* Hero section */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '48px 0 40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(34,197,94,0.8)', boxShadow: '0 0 8px rgba(34,197,94,0.6)' }} />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Live Markets</span>
                  </div>
                  <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '38px', fontWeight: 300, color: 'white', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '12px' }}>
                    Trending <span style={{ color: 'rgba(255,255,255,0.3)' }}>predictions</span>
                  </h1>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.35)', fontWeight: 300, letterSpacing: '0.1px' }}>
                    {SAMPLE_MARKETS.length} active markets · Updated in real time
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '24px', paddingTop: '8px' }}>
                  {[{ label: 'Total Volume', value: '$18.2M', color: 'white' }, { label: 'Active Markets', value: SAMPLE_MARKETS.length.toString(), color: 'white' }, { label: 'Participants', value: '24.8K', color: 'white' }].map((stat, i) => (
                    <div key={i} style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '20px', fontWeight: 500, color: stat.color, letterSpacing: '-0.5px' }}>{stat.value}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured cards — horizontal strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {FEATURED_MARKETS.map((market, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleMarketClick(market.id)}
                    className="featured-card"
                    style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '20px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <span style={{ fontSize: '24px' }}>{market.image}</span>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '18px', fontWeight: 500, color: market.yesPercent > 50 ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.5)', letterSpacing: '-0.5px' }}>{market.yesPercent}%</div>
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, marginBottom: '12px', letterSpacing: '-0.1px' }}>{market.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.5px' }}>{market.volume} vol</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px' }}>{market.category}</span>
                    </div>
                    {/* Yes progress bar */}
                    <div style={{ marginTop: '14px', height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: market.yesPercent + '%', background: market.yesPercent > 50 ? 'rgba(34,197,94,0.6)' : 'rgba(249,115,22,0.6)', borderRadius: '1px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Markets table section */}
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 32px 0' }}>
            {/* Filter row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`cat-pill ${selectedCategory === cat.name ? 'active' : ''}`}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 400, padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.07)', background: selectedCategory === cat.name ? 'rgba(255,255,255,0.1)' : 'transparent', color: selectedCategory === cat.name ? 'white' : 'rgba(255,255,255,0.35)', cursor: 'pointer', letterSpacing: '0.1px' }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px' }}>{filteredMarkets.length} markets</span>
            </div>

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 90px 160px', gap: '16px', padding: '8px 16px', marginBottom: '4px' }}>
              {['Market', 'Odds', 'Volume', 'Ends', ''].map((h, i) => (
                <div key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px', textTransform: 'uppercase', textAlign: i > 0 ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>

            {/* Market rows */}
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
              {filteredMarkets.slice(0, 6).map((market, idx) => (
                <div
                  key={market.id}
                  className="market-row"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 90px 160px', gap: '16px', padding: '14px 16px', borderBottom: idx < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', cursor: 'pointer', background: 'transparent' }}
                  onClick={() => handleMarketClick(market.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: market.yesPercent > 60 ? 'rgba(34,197,94,0.7)' : market.yesPercent < 40 ? 'rgba(249,115,22,0.7)' : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.1px', marginBottom: '2px' }}>{market.question}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px' }}>{market.participants.toLocaleString()} participants · {market.category}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontSize: '13px', fontWeight: 500, color: market.yesPercent > 50 ? 'rgba(34,197,94,0.8)' : 'rgba(249,115,22,0.8)', letterSpacing: '-0.3px' }}>{market.yesPercent}%</div>
                  <div style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.2px' }}>{market.volume}</div>
                  <div style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2px' }}>{market.endDate}</div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                    <button
                      className="yes-btn"
                      onClick={(e) => { e.stopPropagation(); handleMarketClick(market.id); }}
                      style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', fontWeight: 500, padding: '5px 14px', borderRadius: '5px', border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.06)', color: 'rgba(34,197,94,0.7)', cursor: 'pointer', letterSpacing: '0.5px' }}
                    >YES</button>
                    <button
                      className="no-btn"
                      onClick={(e) => { e.stopPropagation(); handleMarketClick(market.id); }}
                      style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', fontWeight: 500, padding: '5px 14px', borderRadius: '5px', border: '1px solid rgba(249,115,22,0.2)', background: 'rgba(249,115,22,0.06)', color: 'rgba(249,115,22,0.7)', cursor: 'pointer', letterSpacing: '0.5px' }}
                    >NO</button>
                  </div>
                </div>
              ))}
            </div>

            {/* View all */}
            <div style={{ padding: '20px 0 40px', textAlign: 'center' }}>
              <button
                onClick={() => setCurrentPage('all-markets')}
                className="view-all-btn"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 400, padding: '10px 28px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', letterSpacing: '0.1px' }}
              >
                View all {SAMPLE_MARKETS.length} markets →
              </button>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'all-markets' && <AllMarketsPage onMarketClick={handleMarketClick} />}
      {currentPage === 'leaderboard' && <LeaderboardPage />}
      {currentPage === 'predictions' && <MyPredictionsPage />}
      {currentPage === 'create' && <CreateMarketPage oracleBalance={oracleBalance} userTier={userTier} />}
      {currentPage === 'market-details' && selectedMarketId && (
        <MarketDetailsPage 
          marketId={selectedMarketId} 
          onBack={() => setCurrentPage('home')} 
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal 
          oracleBalance={oracleBalance}
          userTier={userTier}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};

const AllMarketsPage: FC<{ onMarketClick: (id: number) => void }> = ({ onMarketClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'trending' | 'volume' | 'ending' | 'new'>('trending');

  const allMarkets = [...FEATURED_MARKETS.map(m => ({ ...m, isFeatured: true })), ...SAMPLE_MARKETS.map(m => ({ ...m, isFeatured: false }))];

  const filteredMarkets = allMarkets.filter(market => {
    const matchesSearch = market.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || market.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (sortBy === 'volume') { const volA = parseFloat(a.volume.replace(/[$MK]/g, '')); const volB = parseFloat(b.volume.replace(/[$MK]/g, '')); return volB - volA; }
    else if (sortBy === 'ending') { return new Date(a.endDate).getTime() - new Date(b.endDate).getTime(); }
    else if (sortBy === 'new') { return b.id - a.id; }
    return b.participants - a.participants;
  });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: '100vh' }}>
      <style>{`
        .am-row { transition: background 0.15s ease, border-color 0.15s ease; }
        .am-row:hover { background: rgba(255,255,255,0.03) !important; }
        .am-yes:hover { background: rgba(34,197,94,0.12) !important; border-color: rgba(34,197,94,0.35) !important; color: rgb(34,197,94) !important; }
        .am-no:hover { background: rgba(249,115,22,0.12) !important; border-color: rgba(249,115,22,0.35) !important; color: rgb(249,115,22) !important; }
        .am-cat:hover { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.8) !important; }
        .am-search:focus { border-color: rgba(255,255,255,0.2) !important; outline: none; }
        .am-select:focus { border-color: rgba(255,255,255,0.2) !important; outline: none; }
        .am-sort:hover { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.8) !important; }
      `}</style>

      {/* Page header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '40px 0 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(34,197,94,0.8)', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>All Markets</span>
              </div>
              <h1 style={{ fontSize: '34px', fontWeight: 300, color: 'white', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '8px' }}>
                Browse <span style={{ color: 'rgba(255,255,255,0.3)' }}>predictions</span>
              </h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>
                {allMarkets.length} markets across {CATEGORIES.length - 1} categories
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['trending', 'volume', 'ending', 'new'] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)} className="am-sort" style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.07)', background: sortBy === s ? 'rgba(255,255,255,0.08)' : 'transparent', color: sortBy === s ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)', cursor: 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase', transition: 'all 0.15s' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px' }}>
        {/* Search + category row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>⌕</span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search markets..."
              className="am-search"
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', padding: '8px 12px 8px 32px', color: 'white', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const }}
            />
          </div>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ display: 'flex', gap: '4px' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className="am-cat" style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.07)', background: selectedCategory === cat.name ? 'rgba(255,255,255,0.1)' : 'transparent', color: selectedCategory === cat.name ? 'white' : 'rgba(255,255,255,0.3)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s', whiteSpace: 'nowrap' as const }}>
                {cat.name}
              </button>
            ))}
          </div>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ fontSize: '12px', color: 'rgba(139,92,246,0.7)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Clear
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px' }}>
            {sortedMarkets.length} results
          </span>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 90px 160px', gap: '16px', padding: '8px 16px', marginBottom: '4px' }}>
          {['Market', 'Odds', 'Volume', 'Ends', ''].map((h, i) => (
            <div key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px', textTransform: 'uppercase' as const, textAlign: i > 0 ? 'right' as const : 'left' as const }}>{h}</div>
          ))}
        </div>

        {/* Market rows */}
        {sortedMarkets.length > 0 ? (
          <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
            {sortedMarkets.map((market, idx) => (
              <div key={market.id} className="am-row" onClick={() => onMarketClick(market.id)} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 90px 160px', gap: '16px', padding: '14px 16px', borderBottom: idx < sortedMarkets.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', cursor: 'pointer', background: 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: market.yesPercent > 60 ? 'rgba(34,197,94,0.7)' : market.yesPercent < 40 ? 'rgba(249,115,22,0.7)' : 'rgba(255,255,255,0.25)' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.1px', marginBottom: '2px' }}>{market.question}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{market.participants.toLocaleString()} participants · {market.category}{market.isFeatured ? ' · Featured' : ''}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontSize: '13px', fontWeight: 500, color: market.yesPercent > 50 ? 'rgba(34,197,94,0.8)' : 'rgba(249,115,22,0.8)' }}>{market.yesPercent}%</div>
                <div style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{market.volume}</div>
                <div style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.22)' }}>{market.endDate}</div>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                  <button className="am-yes" onClick={e => { e.stopPropagation(); onMarketClick(market.id); }} style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', padding: '5px 14px', borderRadius: '5px', border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.06)', color: 'rgba(34,197,94,0.6)', cursor: 'pointer', transition: 'all 0.15s' }}>YES</button>
                  <button className="am-no" onClick={e => { e.stopPropagation(); onMarketClick(market.id); }} style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', padding: '5px 14px', borderRadius: '5px', border: '1px solid rgba(249,115,22,0.2)', background: 'rgba(249,115,22,0.06)', color: 'rgba(249,115,22,0.6)', cursor: 'pointer', transition: 'all 0.15s' }}>NO</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.4 }}>⌕</div>
            <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>No markets found</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', marginBottom: '24px' }}>Try adjusting your search or filters</div>
            <button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }} style={{ fontSize: '12px', padding: '8px 20px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Reset filters</button>
          </div>
        )}
      </div>
    </div>
  );
};

const MarketDetailsPage: FC<{ marketId: number; onBack: () => void }> = ({ marketId, onBack }) => {
  const market = FEATURED_MARKETS.find(m => m.id === marketId) ||
    { ...SAMPLE_MARKETS.find(m => m.id === marketId), id: marketId };

  const [showBetModal, setShowBetModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'predictors' | 'comments'>('chart');

  if (!market) return null;

  const yesVol = (parseFloat(market.volume.replace(/[$MK]/g, '')) * (market.yesPercent / 100)).toFixed(1);
  const noVol = (parseFloat(market.volume.replace(/[$MK]/g, '')) * ((100 - market.yesPercent) / 100)).toFixed(1);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: '100vh' }}>
      <style>{`
        .md-tab:hover { color: rgba(255,255,255,0.7) !important; }
        .md-yes:hover { background: rgba(34,197,94,0.12) !important; border-color: rgba(34,197,94,0.5) !important; }
        .md-no:hover { background: rgba(249,115,22,0.12) !important; border-color: rgba(249,115,22,0.5) !important; }
        .md-related:hover { border-color: rgba(255,255,255,0.12) !important; background: rgba(255,255,255,0.03) !important; }
        .md-back:hover { color: rgba(255,255,255,0.8) !important; }
        .md-bar { transition: height 0.2s ease; }
        .md-bar:hover { opacity: 0.8; }
        .md-bar:hover .md-tooltip { opacity: 1 !important; }
      `}</style>

      {/* Top nav breadcrumb */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
          <button onClick={onBack} className="md-back" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", transition: 'color 0.15s', padding: 0 }}>
            <span>←</span>
            <span>Markets</span>
          </button>
        </div>
      </div>

      {/* Market header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '36px 0 28px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '48px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px' }}>{market.category}</span>
                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>·</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{market.participants.toLocaleString()} participants</span>
                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>·</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>Ends {market.endDate}</span>
              </div>
              <h1 style={{ fontSize: '30px', fontWeight: 300, color: 'white', letterSpacing: '-1px', lineHeight: 1.2, marginBottom: '12px' }}>{market.question}</h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontWeight: 300, lineHeight: 1.6 }}>
                Market for predicting whether {market.question.toLowerCase()} The outcome will be resolved based on verified data sources.
              </p>
            </div>

            {/* Probability circle */}
            <div style={{ textAlign: 'center' as const, flexShrink: 0 }}>
              <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '8px' }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={market.yesPercent > 50 ? 'rgba(34,197,94,0.6)' : 'rgba(249,115,22,0.6)'} strokeWidth="8" strokeDasharray={`${(market.yesPercent / 100) * 263.9} 263.9`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '20px', fontWeight: 500, color: market.yesPercent > 50 ? 'rgba(34,197,94,0.9)' : 'rgba(249,115,22,0.9)', letterSpacing: '-0.5px' }}>{market.yesPercent}%</div>
                </div>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textTransform: 'uppercase' as const }}>Yes prob.</div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', marginTop: '28px' }}>
            {[
              { label: 'Total Volume', value: market.volume, color: 'rgba(255,255,255,0.7)' },
              { label: 'Yes Volume', value: '$' + yesVol + 'M', color: 'rgba(34,197,94,0.8)' },
              { label: 'No Volume', value: '$' + noVol + 'M', color: 'rgba(249,115,22,0.8)' },
              { label: 'Liquidity', value: '$890K', color: 'rgba(139,92,246,0.8)' },
            ].map((stat, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 20px' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '6px' }}>{stat.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 500, color: stat.color, letterSpacing: '-0.5px' }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Bet buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
            <button className="md-yes" onClick={() => setShowBetModal(true)} style={{ padding: '14px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.07)', color: 'rgba(34,197,94,0.9)', fontSize: '13px', fontWeight: 500, fontFamily: "'DM Mono', monospace", cursor: 'pointer', letterSpacing: '0.5px', transition: 'all 0.15s' }}>
              BET YES · {market.yesPercent}%
            </button>
            <button className="md-no" onClick={() => setShowBetModal(true)} style={{ padding: '14px', borderRadius: '8px', border: '1px solid rgba(249,115,22,0.25)', background: 'rgba(249,115,22,0.07)', color: 'rgba(249,115,22,0.9)', fontSize: '13px', fontWeight: 500, fontFamily: "'DM Mono', monospace", cursor: 'pointer', letterSpacing: '0.5px', transition: 'all 0.15s' }}>
              BET NO · {100 - market.yesPercent}%
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px' }}>
          {[['chart', 'Price Chart'], ['predictors', 'Top Predictors'], ['comments', `Comments (${MOCK_COMMENTS.length})`]].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className="md-tab" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', padding: '14px 20px', background: 'none', border: 'none', borderBottom: activeTab === tab ? '1px solid rgba(255,255,255,0.6)' : '1px solid transparent', color: activeTab === tab ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.15s', marginBottom: '-1px' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Chart tab */}
        {activeTab === 'chart' && (
          <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>Yes Probability Over Time</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>Current: {market.yesPercent}%</div>
            </div>
            <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', gap: '4px', paddingBottom: '28px', position: 'relative' }}>
              {/* Y axis lines */}
              {[0, 25, 50, 75, 100].map(val => (
                <div key={val} style={{ position: 'absolute', left: 0, right: 0, bottom: `calc(28px + ${val}% * (240px - 28px) / 100)`, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.15)', marginRight: '4px', whiteSpace: 'nowrap' as const }}>{val}%</span>
                </div>
              ))}
              {MOCK_PRICE_HISTORY.map((point, idx) => (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div className="md-bar" style={{ position: 'relative', width: '100%', height: `${point.yesPercent}%`, background: point.yesPercent > 50 ? 'rgba(34,197,94,0.25)' : 'rgba(249,115,22,0.25)', borderRadius: '3px 3px 0 0', borderTop: `2px solid ${point.yesPercent > 50 ? 'rgba(34,197,94,0.6)' : 'rgba(249,115,22,0.6)'}`, cursor: 'pointer' }}>
                    <div className="md-tooltip" style={{ position: 'absolute', top: '-28px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '10px', padding: '3px 6px', borderRadius: '4px', whiteSpace: 'nowrap' as const, opacity: 0, transition: 'opacity 0.15s', fontFamily: "'DM Mono', monospace" }}>{point.yesPercent}%</div>
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '6px', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' as const }}>{point.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Predictors tab */}
        {activeTab === 'predictors' && (
          <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden', marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px', gap: '16px', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              {['Predictor', 'Side', 'Amount', 'Potential Win'].map((h, i) => (
                <div key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px', textTransform: 'uppercase' as const }}>{h}</div>
              ))}
            </div>
            {MOCK_TOP_PREDICTORS.map((predictor, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px', gap: '16px', padding: '14px 16px', borderBottom: idx < MOCK_TOP_PREDICTORS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>{predictor.avatar}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{predictor.username}</span>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: predictor.betSide === 'Yes' ? 'rgba(34,197,94,0.08)' : 'rgba(249,115,22,0.08)', color: predictor.betSide === 'Yes' ? 'rgba(34,197,94,0.8)' : 'rgba(249,115,22,0.8)', display: 'inline-block', textTransform: 'uppercase' as const }}>{predictor.betSide}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{predictor.amount.toLocaleString()} OT</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: 'rgba(34,197,94,0.7)' }}>{predictor.potentialWin.toLocaleString()} OT</div>
              </div>
            ))}
          </div>
        )}

        {/* Comments tab */}
        {activeTab === 'comments' && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
              {MOCK_COMMENTS.map((comment, idx) => (
                <div key={comment.id} style={{ padding: '16px 20px', borderBottom: idx < MOCK_COMMENTS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>{comment.avatar}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{comment.username}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{comment.time}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: '8px' }}>{comment.comment}</p>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0 }}>↑ {comment.likes}</button>
                        <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0 }}>Reply</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '12px', background: 'rgba(255,255,255,0.02)' }}>
              <textarea placeholder="Share your thoughts..." style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", resize: 'none' as const, minHeight: '80px', outline: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '4px' }}>
                <button style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', padding: '6px 16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', letterSpacing: '0.5px' }}>POST</button>
              </div>
            </div>
          </div>
        )}

        {/* Related markets */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Related Markets</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {SAMPLE_MARKETS.filter(m => m.category === market.category && m.id !== marketId).slice(0, 3).map(rel => (
              <div key={rel.id} className="md-related" style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '10px', lineHeight: 1.4 }}>{rel.question}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{rel.volume}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: rel.yesPercent > 50 ? 'rgba(34,197,94,0.7)' : 'rgba(249,115,22,0.7)' }}>{rel.yesPercent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showBetModal && (
        <BetModal market={market} onClose={() => setShowBetModal(false)} />
      )}
    </div>
  );
};

const CreateMarketPage: FC<{ oracleBalance: number; userTier: string }> = ({ oracleBalance, userTier }) => {
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    category: 'Crypto',
    endDate: '',
    option1: 'Yes',
    option2: 'No',
    initialLiquidity: '100'
  });

  const canCreate = oracleBalance >= 1000;
  const creationCost = 100;

  const handleSubmit = () => {
    setStep('preview');
  };

  const handleConfirm = () => {
    alert('Market created successfully! (This would call the smart contract in production)');
    setStep('form');
    setFormData({
      question: '',
      description: '',
      category: 'Crypto',
      endDate: '',
      option1: 'Yes',
      option2: 'No',
      initialLiquidity: '100'
    });
  };

  if (!canCreate) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500/30 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-3xl font-bold text-white mb-4">Expert Tier Required</h2>
          <p className="text-gray-300 mb-6">You need at least 1,000 Oracle Tokens to create markets.</p>
          <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
            <div className="text-gray-400 text-sm mb-2">Your Balance</div>
            <div className="text-4xl font-bold text-purple-400 mb-4">{oracleBalance.toLocaleString()} tokens</div>
            <div className="w-full bg-gray-600 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                style={{ width: `${Math.min((oracleBalance / 1000) * 100, 100)}%` }}
              />
            </div>
            <div className="text-gray-400 text-sm">Need {(1000 - oracleBalance).toLocaleString()} more tokens</div>
          </div>
          <div className="text-gray-400 text-sm">
            Earn Oracle Tokens by making accurate predictions!
          </div>
        </div>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Preview Your Market</h1>
          <p className="text-gray-400">Review and confirm before creating</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur border border-purple-500/30 rounded-2xl p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-sm font-bold">
                {formData.category}
              </span>
              <span className="text-gray-400 text-sm">Ends {formData.endDate}</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">{formData.question}</h2>
            <p className="text-gray-300 text-lg">{formData.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-green-400 font-bold text-xl">{formData.option1}</div>
              <div className="text-gray-400 text-sm mt-2">Starting at 50%</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-2">❌</div>
              <div className="text-orange-400 font-bold text-xl">{formData.option2}</div>
              <div className="text-gray-400 text-sm mt-2">Starting at 50%</div>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-gray-400 text-sm mb-1">Initial Liquidity</div>
                <div className="text-white font-bold text-xl">{formData.initialLiquidity} tokens</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Creation Cost</div>
                <div className="text-yellow-400 font-bold text-xl">{creationCost} tokens</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Your Earnings</div>
                <div className="text-green-400 font-bold text-xl">2% of volume</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setStep('form')}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg transition"
          >
            ← Back to Edit
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-lg transition shadow-lg"
          >
            Create Market (Cost: {creationCost} tokens)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">🎯 Create New Market</h1>
        <p className="text-gray-400">Create a prediction market and earn fees from trading activity</p>
      </div>

      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6 mb-8">
        <h3 className="text-white font-bold text-lg mb-3">Market Creator Benefits:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💰</span>
            <div>
              <div className="text-white font-semibold">Earn Fees</div>
              <div className="text-gray-300 text-sm">2% of all trading volume</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">📈</span>
            <div>
              <div className="text-white font-semibold">Build Reputation</div>
              <div className="text-gray-300 text-sm">Popular markets boost your tier</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="text-white font-semibold">Creator Badge</div>
              <div className="text-gray-300 text-sm">Special recognition on leaderboard</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-white font-semibold mb-2">
              Market Question <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="e.g., Will Bitcoin reach $100K by end of 2026?"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={200}
            />
            <div className="text-gray-400 text-sm mt-1">{formData.question.length}/200 characters</div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide context and resolution criteria..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px]"
              maxLength={500}
            />
            <div className="text-gray-400 text-sm mt-1">{formData.description.length}/500 characters</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-semibold mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {CATEGORIES.slice(1).map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">
                End Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Outcome Options
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.option1}
                onChange={(e) => setFormData({ ...formData, option1: e.target.value })}
                placeholder="Option 1"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={50}
              />
              <input
                type="text"
                value={formData.option2}
                onChange={(e) => setFormData({ ...formData, option2: e.target.value })}
                placeholder="Option 2"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={50}
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Initial Liquidity (Oracle Tokens)
            </label>
            <input
              type="number"
              value={formData.initialLiquidity}
              onChange={(e) => setFormData({ ...formData, initialLiquidity: e.target.value })}
              min="100"
              max={oracleBalance - creationCost}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="text-gray-400 text-sm mt-1">
              Minimum: 100 tokens | Available: {(oracleBalance - creationCost).toLocaleString()} tokens
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-6">
            <h4 className="text-white font-bold mb-4">Cost Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Creation Fee</span>
                <span className="text-white font-bold">{creationCost} tokens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Initial Liquidity</span>
                <span className="text-white font-bold">{formData.initialLiquidity} tokens</span>
              </div>
              <div className="border-t border-gray-600 pt-3 flex justify-between">
                <span className="text-white font-bold">Total Cost</span>
                <span className="text-yellow-400 font-bold text-xl">
                  {parseInt(formData.initialLiquidity || '0') + creationCost} tokens
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!formData.question || !formData.description || !formData.endDate}
          className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition shadow-lg"
        >
          Preview Market →
        </button>
      </div>
    </div>
  );
};

const MyPredictionsPage: FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'analytics'>('active');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'profit'>('date');

  const totalWins = MOCK_PREDICTION_HISTORY.filter(p => p.result === 'Won').length;
  const totalLosses = MOCK_PREDICTION_HISTORY.filter(p => p.result === 'Lost').length;
  const totalProfit = MOCK_PREDICTION_HISTORY.reduce((sum, p) => sum + p.profit, 0);
  const winRate = ((totalWins / MOCK_PREDICTION_HISTORY.length) * 100).toFixed(0);
  const avgProfit = (totalProfit / MOCK_PREDICTION_HISTORY.length).toFixed(0);

  const filteredHistory = filterCategory === 'All'
    ? MOCK_PREDICTION_HISTORY
    : MOCK_PREDICTION_HISTORY.filter(p => p.category === filterCategory);

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (sortBy === 'profit') return b.profit - a.profit;
    if (sortBy === 'amount') return b.amount - a.amount;
    return 0;
  });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: '100vh' }}>
      <style>{`
        .mp-row { transition: background 0.15s ease; }
        .mp-row:hover { background: rgba(255,255,255,0.03) !important; }
        .mp-tab:hover { color: rgba(255,255,255,0.7) !important; }
        .mp-sort:hover { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.7) !important; }
      `}</style>

      {/* Page header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '40px 0 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(139,92,246,0.8)', boxShadow: '0 0 8px rgba(139,92,246,0.5)' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Portfolio</span>
              </div>
              <h1 style={{ fontSize: '34px', fontWeight: 300, color: 'white', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '8px' }}>
                My <span style={{ color: 'rgba(255,255,255,0.3)' }}>predictions</span>
              </h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>
                {MOCK_ACTIVE_PREDICTIONS.length} active · {MOCK_PREDICTION_HISTORY.length} completed
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'Active Bets', value: MOCK_ACTIVE_PREDICTIONS.length.toString(), sub: 'in progress', color: 'rgba(139,92,246,0.8)' },
              { label: 'Total Wins', value: totalWins.toString(), sub: winRate + '% win rate', color: 'rgba(34,197,94,0.8)' },
              { label: 'Total Losses', value: totalLosses.toString(), sub: MOCK_PREDICTION_HISTORY.length + ' total bets', color: 'rgba(239,68,68,0.8)' },
              { label: 'Total Profit', value: '+' + totalProfit, sub: 'oracle tokens', color: 'rgba(234,179,8,0.8)' },
              { label: 'Avg Profit', value: '+' + avgProfit, sub: 'per prediction', color: 'rgba(96,165,250,0.8)' },
            ].map((stat, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px 24px' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>{stat.label}</div>
                <div style={{ fontSize: '24px', fontWeight: 500, color: stat.color, letterSpacing: '-1px', marginBottom: '4px' }}>{stat.value}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px' }}>
        {/* Tabs + filters row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '0px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', overflow: 'hidden' }}>
            {[['active', `Active (${MOCK_ACTIVE_PREDICTIONS.length})`], ['history', `History (${MOCK_PREDICTION_HISTORY.length})`], ['analytics', 'Analytics']].map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className="mp-tab" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', padding: '7px 16px', background: activeTab === tab ? 'rgba(255,255,255,0.08)' : 'transparent', color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.3)', border: 'none', borderRight: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' as const }}>
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'history' && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <option value="All">All Categories</option>
                {CATEGORIES.slice(1).map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <option value="date">By Date</option>
                <option value="profit">By Profit</option>
                <option value="amount">By Amount</option>
              </select>
            </div>
          )}
        </div>

        {/* Active tab */}
        {activeTab === 'active' && (
          <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 100px 120px 120px', gap: '16px', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              {['Market', 'Side', 'Amount', 'Odds', 'Potential Win', 'Ends'].map((h, i) => (
                <div key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px', textTransform: 'uppercase' as const }}>{h}</div>
              ))}
            </div>
            {MOCK_ACTIVE_PREDICTIONS.map((pred, idx) => (
              <div key={pred.id} className="mp-row" style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 100px 120px 120px', gap: '16px', padding: '14px 16px', borderBottom: idx < MOCK_ACTIVE_PREDICTIONS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginBottom: '2px', letterSpacing: '-0.1px' }}>{pred.market}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{pred.category} · Placed {pred.placedDate}</div>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: pred.betSide === 'Yes' ? 'rgba(34,197,94,0.08)' : 'rgba(249,115,22,0.08)', color: pred.betSide === 'Yes' ? 'rgba(34,197,94,0.8)' : 'rgba(249,115,22,0.8)', display: 'inline-block', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{pred.betSide}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{pred.amount} OT</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{pred.currentOdds}%</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: 'rgba(34,197,94,0.8)' }}>{pred.potentialWin} OT</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{pred.endDate}</div>
              </div>
            ))}
          </div>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px 100px', gap: '16px', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              {['Market', 'Side', 'Amount', 'Result', 'Profit'].map((h, i) => (
                <div key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px', textTransform: 'uppercase' as const }}>{h}</div>
              ))}
            </div>
            {sortedHistory.map((pred, idx) => (
              <div key={pred.id} className="mp-row" style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px 100px', gap: '16px', padding: '12px 16px', borderBottom: idx < sortedHistory.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginBottom: '2px', letterSpacing: '-0.1px' }}>{pred.market}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{pred.category} · {pred.date}</div>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: pred.betSide === 'Yes' ? 'rgba(34,197,94,0.08)' : 'rgba(249,115,22,0.08)', color: pred.betSide === 'Yes' ? 'rgba(34,197,94,0.8)' : 'rgba(249,115,22,0.8)', display: 'inline-block', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{pred.betSide}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{pred.amount} OT</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: pred.result === 'Won' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', color: pred.result === 'Won' ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.7)', display: 'inline-block', letterSpacing: '0.5px' }}>{pred.result}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: pred.profit > 0 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.7)', letterSpacing: '-0.3px' }}>{pred.profit > 0 ? '+' : ''}{pred.profit}</div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics tab */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Category performance */}
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>Performance by Category</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>Accuracy across all markets</div>
              </div>
              <div style={{ padding: '8px 0' }}>
                {CATEGORY_REPUTATION.map((cat, idx) => (
                  <div key={cat.category} style={{ padding: '12px 20px', borderBottom: idx < CATEGORY_REPUTATION.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{cat.category}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginLeft: '8px' }}>{cat.wins}W · {cat.total - cat.wins}L</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: 'rgba(139,92,246,0.8)' }}>{cat.accuracy}%</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(234,179,8,0.6)' }}>{cat.tokens} OT</span>
                      </div>
                    </div>
                    <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: cat.accuracy + '%', background: 'rgba(139,92,246,0.5)', borderRadius: '1px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Win/Loss */}
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>Win / Loss Distribution</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>Overall prediction accuracy</div>
              </div>
              <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '28px' }}>
                  <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(239,68,68,0.25)" strokeWidth="12" strokeDasharray={`${(totalLosses / MOCK_PREDICTION_HISTORY.length) * 251.2} 251.2`} />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="12" strokeDasharray={`${(totalWins / MOCK_PREDICTION_HISTORY.length) * 251.2} 251.2`} strokeDashoffset={`-${(totalLosses / MOCK_PREDICTION_HISTORY.length) * 251.2}`} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '26px', fontWeight: 300, color: 'white', letterSpacing: '-1px' }}>{winRate}%</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase' as const }}>Win Rate</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                  <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: '8px', padding: '16px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '28px', fontWeight: 300, color: 'rgba(34,197,94,0.8)', letterSpacing: '-1px', marginBottom: '4px' }}>{totalWins}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(34,197,94,0.4)', letterSpacing: '1px', textTransform: 'uppercase' as const }}>Wins</div>
                  </div>
                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: '8px', padding: '16px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '28px', fontWeight: 300, color: 'rgba(239,68,68,0.7)', letterSpacing: '-1px', marginBottom: '4px' }}>{totalLosses}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(239,68,68,0.4)', letterSpacing: '1px', textTransform: 'uppercase' as const }}>Losses</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LeaderboardPage: FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredLeaderboard = selectedCategory === 'All'
    ? LEADERBOARD_DATA
    : LEADERBOARD_DATA.filter(user => user.category === selectedCategory || user.username === 'You');

  const yourRank = LEADERBOARD_DATA.find(u => u.username === 'You');

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: '100vh' }}>
      <style>{`
        .lb-row { transition: background 0.15s ease; }
        .lb-row:hover { background: rgba(255,255,255,0.03) !important; }
        .lb-cat:hover { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.8) !important; }
      `}</style>

      {/* Page header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '40px 0 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(234,179,8,0.8)', boxShadow: '0 0 8px rgba(234,179,8,0.5)' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Rankings</span>
              </div>
              <h1 style={{ fontSize: '34px', fontWeight: 300, color: 'white', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '8px' }}>
                Leaderboard <span style={{ color: 'rgba(255,255,255,0.3)' }}>· top predictors</span>
              </h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>
                Ranked by Oracle Tokens earned · {LEADERBOARD_DATA.length} participants
              </p>
            </div>
            {/* Your rank card */}
            {yourRank && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Your Rank</div>
                  <div style={{ fontSize: '28px', fontWeight: 300, color: 'white', letterSpacing: '-1px' }}>#{yourRank.rank}</div>
                </div>
                <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.07)' }} />
                {[{ label: 'Tokens', value: yourRank.totalTokens.toLocaleString() }, { label: 'Win Rate', value: yourRank.winRate + '%' }, { label: 'Predictions', value: yourRank.totalPredictions.toString() }].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '16px', fontWeight: 500, color: 'white', letterSpacing: '-0.5px' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px' }}>
        {/* Category filter */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className="lb-cat" style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.07)', background: selectedCategory === cat.name ? 'rgba(255,255,255,0.1)' : 'transparent', color: selectedCategory === cat.name ? 'white' : 'rgba(255,255,255,0.3)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s', whiteSpace: 'nowrap' as const }}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 90px 120px 140px 80px 80px', gap: '16px', padding: '8px 16px', marginBottom: '4px' }}>
          {['Rank', 'User', 'Tier', 'Tokens', 'Win Rate', 'W/L', 'Focus'].map((h, i) => (
            <div key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px', textTransform: 'uppercase' as const }}>{h}</div>
          ))}
        </div>

        {/* Leaderboard rows */}
        <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
          {filteredLeaderboard.map((user, idx) => (
            <div key={user.rank} className="lb-row" style={{ display: 'grid', gridTemplateColumns: '60px 1fr 90px 120px 140px 80px 80px', gap: '16px', padding: '12px 16px', borderBottom: idx < filteredLeaderboard.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', background: user.username === 'You' ? 'rgba(139,92,246,0.05)' : 'transparent', borderLeft: user.username === 'You' ? '2px solid rgba(139,92,246,0.4)' : '2px solid transparent' }}>
              
              {/* Rank */}
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: idx === 0 ? 'rgba(234,179,8,0.9)' : idx === 1 ? 'rgba(200,200,200,0.7)' : idx === 2 ? 'rgba(180,120,60,0.8)' : 'rgba(255,255,255,0.25)', fontWeight: idx < 3 ? 600 : 400 }}>
                {idx < 3 ? ['01', '02', '03'][idx] : '#' + user.rank}
              </div>

              {/* User */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>{user.avatar}</span>
                <span style={{ fontSize: '13px', fontWeight: 400, color: user.username === 'You' ? 'rgba(139,92,246,0.9)' : 'rgba(255,255,255,0.85)', letterSpacing: '-0.1px' }}>{user.username}</span>
              </div>

              {/* Tier */}
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.5px', color: user.tier === 'Oracle' ? 'rgba(234,179,8,0.7)' : user.tier === 'Expert' ? 'rgba(139,92,246,0.7)' : 'rgba(96,165,250,0.7)', background: user.tier === 'Oracle' ? 'rgba(234,179,8,0.08)' : user.tier === 'Expert' ? 'rgba(139,92,246,0.08)' : 'rgba(96,165,250,0.08)', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', textTransform: 'uppercase' as const }}>
                {user.tier}
              </div>

              {/* Tokens */}
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: 'rgba(34,197,94,0.8)', letterSpacing: '-0.3px' }}>
                {user.totalTokens.toLocaleString()}
              </div>

              {/* Win rate with bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.6)', minWidth: '32px' }}>{user.winRate}%</span>
                <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: user.winRate + '%', background: 'rgba(34,197,94,0.5)', borderRadius: '1px' }} />
                </div>
              </div>

              {/* W/L */}
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                {user.wins}/{user.totalPredictions}
              </div>

              {/* Focus */}
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3px' }}>
                {user.category}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MarketCard: FC<{ market: any; onMarketClick: (id: number) => void; featured?: boolean }> = ({ market, onMarketClick, featured }) => {
  const [showBetModal, setShowBetModal] = useState(false);
  
  return (
    <>
      <div 
        onClick={() => onMarketClick(market.id)}
        className={`bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all cursor-pointer transform hover:scale-[1.02] ${
          featured ? 'ring-2 ring-purple-500/30' : ''
        }`}
      >
        {featured && (
          <div className="mb-2">
            <span className="px-2 py-1 rounded bg-purple-600 text-white text-xs font-bold">FEATURED</span>
          </div>
        )}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-medium text-purple-400">{market.category}</span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-400">{market.participants?.toLocaleString()} participants</span>
            </div>
            <h3 className="text-white font-semibold text-lg leading-tight">{market.question}</h3>
          </div>
          <div className="flex flex-col items-end ml-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${
              market.yesPercent > 50 ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
            }`}>
              {market.yesPercent}%
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Volume</span>
            <span className="text-white font-medium">{market.volume}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Ends</span>
            <span className="text-white font-medium">{market.endDate}</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowBetModal(true); }}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-green-500/50"
          >
            Yes
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowBetModal(true); }}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-orange-500/50"
          >
            No
          </button>
        </div>
      </div>

      {showBetModal && (
        <BetModal market={market} onClose={() => setShowBetModal(false)} />
      )}
    </>
  );
};

const BetModal: FC<{ market: any; onClose: () => void; initialSide?: 'yes' | 'no' }> = ({ market, onClose, initialSide }) => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [betAmount, setBetAmount] = useState('');
  const [betSide, setBetSide] = useState<'yes' | 'no'>(initialSide || 'yes');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [txSignature, setTxSignature] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const potentialWin = betAmount
    ? betSide === 'yes'
      ? (parseFloat(betAmount) / (market.yesPercent / 100)).toFixed(0)
      : (parseFloat(betAmount) / ((100 - market.yesPercent) / 100)).toFixed(0)
    : '0';

  const handleBet = async () => {
    if (!publicKey) { setErrorMsg('Please connect your wallet first.'); setStatus('error'); return; }
    if (!betAmount || parseFloat(betAmount) <= 0) { setErrorMsg('Please enter a valid amount.'); setStatus('error'); return; }
    setStatus('loading');
    setErrorMsg('');
    try {
      const { PublicKey, Transaction, SystemProgram } = await import('@solana/web3.js');
      const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import('@solana/spl-token');

      const PROGRAM_ID = new PublicKey('HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj');
      const ORACLE_TOKEN_MINT = new PublicKey('6SnhG4g4icbJ2i9U97zEtxkSc6dZ5Z8sCSTtSJH2QuqA');
      const MARKET_PDA = new PublicKey('CuvChQETTNKYcnDNJwTQccQkQwJpuK8tqv3KWfwB7Jd2');

      const idl = (await import('./target/idl/oracle_token.json')).default;
      const { Program, AnchorProvider, BN } = anchor;

      const anchorProvider = new AnchorProvider(
        connection,
        { publicKey, signTransaction: async (tx: any) => tx, signAllTransactions: async (txs: any) => txs } as any,
        { commitment: 'confirmed' }
      );
      const program = new Program(idl as any, anchorProvider);

      const [predictionPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('prediction'), publicKey.toBuffer(), MARKET_PDA.toBuffer()],
        PROGRAM_ID
      );
      const [userProfile] = PublicKey.findProgramAddressSync(
        [Buffer.from('profile'), publicKey.toBuffer()],
        PROGRAM_ID
      );

      const userTokenAccount = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, publicKey);
      const marketVault = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, MARKET_PDA, true);

      const optionIndex = betSide === 'yes' ? 0 : 1;
      const amount = new BN(Math.floor(parseFloat(betAmount)));

      // Create user profile if it doesn't exist
      const transaction = new Transaction();
      const profileInfo = await connection.getAccountInfo(userProfile);
      if (!profileInfo) {
        const createProfileIx = await (program.methods as any)
          .createUserProfile()
          .accounts({
            userProfile,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        transaction.add(createProfileIx);
      }

      const ix = await (program.methods as any)
        .makePrediction(optionIndex, amount)
        .accounts({
          prediction: predictionPDA,
          market: MARKET_PDA,
          userProfile,
          user: publicKey,
          userTokenAccount,
          marketVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      transaction.add(ix);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      setTxSignature(signature);
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Transaction failed. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px', fontFamily: "'DM Sans', sans-serif" }} onClick={onClose}>
        <div style={{ background: '#0e0e0e', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', padding: '32px', maxWidth: '420px', width: '100%', textAlign: 'center' as const }} onClick={e => e.stopPropagation()}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '20px' }}>✓</div>
          <div style={{ fontSize: '18px', fontWeight: 500, color: 'white', marginBottom: '6px', letterSpacing: '-0.3px' }}>Prediction Placed</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '24px' }}>
            You predicted <span style={{ color: betSide === 'yes' ? 'rgba(34,197,94,0.9)' : 'rgba(249,115,22,0.9)', fontFamily: "'DM Mono', monospace" }}>{betSide === 'yes' ? 'YES' : 'NO'}</span> on this market
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '16px', marginBottom: '16px', textAlign: 'left' as const }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '14px', lineHeight: 1.5 }}>{market.question}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[{ label: 'Amount', value: parseFloat(betAmount).toLocaleString() + ' OT', color: 'rgba(255,255,255,0.6)' }, { label: 'Potential Win', value: parseFloat(potentialWin).toLocaleString() + ' OT', color: 'rgba(34,197,94,0.8)' }].map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid rgba(34,197,94,0.12)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', background: 'rgba(34,197,94,0.04)' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(34,197,94,0.6)', letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '6px' }}>Transaction Confirmed</div>
            <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(139,92,246,0.7)', textDecoration: 'none', wordBreak: 'break-all' as const }}>
              {txSignature.slice(0, 20)}...{txSignature.slice(-8)} ↗
            </a>
          </div>

          <button onClick={onClose} style={{ width: '100%', padding: '11px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', letterSpacing: '0.1px' }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px', fontFamily: "'DM Sans', sans-serif" }} onClick={onClose}>
      <div style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px', maxWidth: '420px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <style>{`
          .bm-yes-btn:hover { background: rgba(34,197,94,0.12) !important; border-color: rgba(34,197,94,0.4) !important; }
          .bm-no-btn:hover { background: rgba(249,115,22,0.12) !important; border-color: rgba(249,115,22,0.4) !important; }
          .bm-amt:hover { background: rgba(255,255,255,0.08) !important; color: rgba(255,255,255,0.7) !important; }
          .bm-confirm:hover { background: rgba(255,255,255,0.08) !important; }
          .bm-confirm:disabled { opacity: 0.35 !important; cursor: not-allowed !important; }
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Place Prediction</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, maxWidth: '320px' }}>{market.question}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: '20px', cursor: 'pointer', padding: '0 0 0 16px', lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '20px' }} />

        {/* Yes/No toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <button className="bm-yes-btn" onClick={() => setBetSide('yes')} style={{ padding: '12px', borderRadius: '7px', border: betSide === 'yes' ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.07)', background: betSide === 'yes' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)', color: betSide === 'yes' ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace", fontSize: '12px', letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.15s' }}>
            YES · {market.yesPercent}%
          </button>
          <button className="bm-no-btn" onClick={() => setBetSide('no')} style={{ padding: '12px', borderRadius: '7px', border: betSide === 'no' ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.07)', background: betSide === 'no' ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)', color: betSide === 'no' ? 'rgba(249,115,22,0.9)' : 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace", fontSize: '12px', letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.15s' }}>
            NO · {100 - market.yesPercent}%
          </button>
        </div>

        {/* Amount input */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', textTransform: 'uppercase' as const, marginBottom: '8px' }}>Amount · Oracle Tokens</div>
          <input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} placeholder="0" min="1" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', padding: '11px 14px', color: 'white', fontSize: '16px', fontFamily: "'DM Mono', monospace", outline: 'none', boxSizing: 'border-box' as const, letterSpacing: '-0.3px' }} />
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            {[50, 100, 250, 500].map(amt => (
              <button key={amt} className="bm-amt" onClick={() => setBetAmount(String(amt))} style={{ flex: 1, padding: '6px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace", fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s' }}>{amt}</button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
          {[
            { label: 'Prediction', value: `${betSide === 'yes' ? 'YES' : 'NO'} @ ${betSide === 'yes' ? market.yesPercent : 100 - market.yesPercent}%`, color: betSide === 'yes' ? 'rgba(34,197,94,0.8)' : 'rgba(249,115,22,0.8)' },
            { label: 'Amount', value: (betAmount || '0') + ' OT', color: 'rgba(255,255,255,0.6)' },
            { label: 'Potential Win', value: potentialWin + ' OT', color: 'rgba(34,197,94,0.8)', border: true },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: row.border ? '10px' : 0, marginTop: row.border ? '10px' : 0, borderTop: row.border ? '1px solid rgba(255,255,255,0.06)' : 'none', marginBottom: i < 2 ? '8px' : 0 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.5px' }}>{row.label}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: row.color, fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
        </div>

        {status === 'error' && (
          <div style={{ border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px', padding: '10px 14px', marginBottom: '14px', background: 'rgba(239,68,68,0.05)', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(239,68,68,0.8)' }}>{errorMsg}</div>
        )}

        {/* Confirm button */}
        <button onClick={handleBet} disabled={status === 'loading' || !betAmount} className="bm-confirm" style={{ width: '100%', padding: '12px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontFamily: "'DM Mono', monospace", cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {status === 'loading' ? (
            <><svg style={{ animation: 'spin 1s linear infinite', width: '14px', height: '14px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg><span>CONFIRMING ON SOLANA</span></>
          ) : <span>CONFIRM PREDICTION 🔮</span>}
        </button>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.15)', textAlign: 'center' as const, marginTop: '10px', letterSpacing: '0.5px' }}>
          DEVNET · ~0.001 SOL NETWORK FEE
        </div>
      </div>
    </div>
  );
};

const ProfileModal: FC<{ oracleBalance: number; userTier: string; onClose: () => void }> = ({ oracleBalance, userTier, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'history' | 'reputation'>('overview');

  const getTierProgress = () => {
    if (userTier === 'Novice') return { current: oracleBalance, next: 100, nextTier: 'Basic', percentage: (oracleBalance / 100) * 100 };
    if (userTier === 'Basic') return { current: oracleBalance, next: 1000, nextTier: 'Expert', percentage: (oracleBalance / 1000) * 100 };
    if (userTier === 'Expert') return { current: oracleBalance, next: 10000, nextTier: 'Oracle', percentage: (oracleBalance / 10000) * 100 };
    return { current: oracleBalance, next: oracleBalance, nextTier: 'Max', percentage: 100 };
  };

  const tierProgress = getTierProgress();
  const totalWins = MOCK_PREDICTION_HISTORY.filter(p => p.result === 'Won').length;
  const totalPredictions = MOCK_PREDICTION_HISTORY.length;
  const winRate = ((totalWins / totalPredictions) * 100).toFixed(0);
  const totalEarned = MOCK_PREDICTION_HISTORY.filter(p => p.result === 'Won').reduce((sum, p) => sum + (p.payout - p.amount), 0);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-purple-500/30 rounded-2xl max-w-4xl w-full shadow-2xl my-8" onClick={e => e.stopPropagation()}>
        
        <div className="relative p-8 border-b border-gray-700">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
          
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold text-white">
              {userTier[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">Your Profile</h2>
              <div className="flex items-center space-x-4">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-sm">
                  {userTier} Tier
                </span>
                <span className="text-gray-400 text-sm">{oracleBalance.toLocaleString()} Oracle Tokens</span>
              </div>
            </div>
          </div>

          {userTier !== 'Oracle' && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Progress to {tierProgress.nextTier}</span>
                <span className="text-purple-400 font-bold">{tierProgress.current.toLocaleString()} / {tierProgress.next.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${Math.min(tierProgress.percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 p-8 border-b border-gray-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">{totalPredictions}</div>
            <div className="text-sm text-gray-400">Total Predictions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">{totalWins}</div>
            <div className="text-sm text-gray-400">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">{winRate}%</div>
            <div className="text-sm text-gray-400">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-1">+{totalEarned.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Tokens Earned</div>
          </div>
        </div>

        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-4 font-medium transition ${
              activeTab === 'active' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Active Bets ({MOCK_ACTIVE_PREDICTIONS.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 font-medium transition ${
              activeTab === 'history' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            History ({MOCK_PREDICTION_HISTORY.length})
          </button>
          <button
            onClick={() => setActiveTab('reputation')}
            className={`flex-1 py-4 font-medium transition ${
              activeTab === 'reputation' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Reputation
          </button>
        </div>

        <div className="p-8 max-h-96 overflow-y-auto">
          {activeTab === 'active' && (
            <div className="space-y-4">
              {MOCK_ACTIVE_PREDICTIONS.map(pred => (
                <div key={pred.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">{pred.market}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          pred.betSide === 'Yes' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {pred.betSide}
                        </span>
                        <span className="text-gray-400 text-sm">{pred.amount} tokens</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-400 text-xs mb-1">Current Odds</div>
                      <div className="text-white font-bold">{pred.currentOdds}%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Potential Win: <span className="text-green-400 font-bold">{pred.potentialWin} tokens</span></span>
                    <span className="text-gray-500">Ends {pred.endDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {MOCK_PREDICTION_HISTORY.map(pred => (
                <div key={pred.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">{pred.market}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        pred.betSide === 'Yes' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {pred.betSide}
                      </span>
                      <span className="text-gray-400 text-sm">{pred.amount} tokens</span>
                      <span className="text-gray-500 text-xs">• {pred.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-lg font-bold ${
                      pred.result === 'Won' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {pred.result}
                    </div>
                    {pred.result === 'Won' && (
                      <div className="text-green-400 text-sm mt-1">+{pred.payout - pred.amount} tokens</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reputation' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-white font-bold text-lg mb-2">Category Performance</h3>
                <p className="text-gray-400 text-sm">Your reputation score by prediction category</p>
              </div>
              {CATEGORY_REPUTATION.map(cat => (
                <div key={cat.category} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="text-white font-semibold">{cat.category}</h4>
                      <div className="text-sm text-gray-400">{cat.wins} wins / {cat.total} predictions</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-400">{cat.accuracy}%</div>
                      <div className="text-xs text-gray-400">Accuracy</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{ width: `${cat.accuracy}%` }}
                        />
                      </div>
                    </div>
                    <span className="ml-4 text-yellow-400 font-bold">{cat.tokens} tokens</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OracleTokenApp;
