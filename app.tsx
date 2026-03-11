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
const CATEGORIES = ['All', 'Crypto', 'Sports', 'Politics', 'AI', 'Finance', 'Science'];
const CAT_ICONS: Record<string, string> = {
  'All': '✦', 'Crypto': '₿', 'Politics': '🗳️', 'AI': '🤖', 'Sports': '🏆', 'Finance': '📈', 'Science': '🌙'
};

const MARKETS = [
  { id: 1,  question: "Will BTC reach $100k by end of 2025?",       category: "Crypto",   yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "btc",    gradient: "linear-gradient(135deg,#1a1a4e,#2d1b69,#1a0a3e)" },
  { id: 2,  question: "Will Solana hit $500 by end of 2025?",        category: "Crypto",   yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "sol",    gradient: "linear-gradient(135deg,#0a1a2e,#1a2d4e,#0a1a3e)" },
  { id: 3,  question: "Will Bitcoin hit $150k in 2025?",             category: "Crypto",   yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "btc",    gradient: "linear-gradient(135deg,#0a1a1a,#0a2d3d,#1a0a3e)" },
  { id: 4,  question: "Will Solana flip Ethereum by market cap?",    category: "Crypto",   yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "sol",    gradient: "linear-gradient(135deg,#1a0a0a,#3d0a1e,#1a0a2e)" },
  { id: 5,  question: "Will the Fed cut rates 3+ times in 2025?",    category: "Finance",  yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "finance", gradient: "linear-gradient(135deg,#0a0a2e,#1a1a4e,#0a1a3e)" },
  { id: 6,  question: "Will Ethereum hit $10k in 2026?",             category: "Crypto",   yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "eth",    gradient: "linear-gradient(135deg,#0a1a0a,#1a2d1a,#0a1a2e)" },
  { id: 7,  question: "Will Solana flip Ethereum by TVL?",           category: "Crypto",   yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "sol",    gradient: "linear-gradient(135deg,#1a1a0a,#2d2d0a,#1a0a3e)" },
  { id: 8,  question: "Will AI replace 10% of jobs by 2027?",        category: "AI",       yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "ai",     gradient: "linear-gradient(135deg,#1a0a0a,#3d1a0a,#1a0a3e)" },
  { id: 9,  question: "Will gold hit $3500 in 2026?",                category: "Finance",  yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "finance", gradient: "linear-gradient(135deg,#0a1a1a,#0a2d2d,#0a1a3e)" },
  { id: 10, question: "Will SpaceX land on Mars by 2030?",           category: "Science",  yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "planet",  gradient: "linear-gradient(135deg,#1a1a1a,#2d2d2d,#1a1a3e)" },
  // Sports markets
  { id: 11, question: "Will Manchester City win Premier League 2025/26?",    category: "Sports",  yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "sports", gradient: "linear-gradient(135deg,#0a1a2e,#0a2d3d,#0a1a4e)" },
  { id: 12, question: "Will the Golden State Warriors reach NBA Finals 2026?",category: "Sports",  yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "sports", gradient: "linear-gradient(135deg,#1a1a0a,#2d2d0a,#1a2a0a)" },
  { id: 13, question: "Will Novak Djokovic win Wimbledon 2026?",             category: "Sports",  yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "sports", gradient: "linear-gradient(135deg,#0a2e0a,#0a3d1a,#0a1a2e)" },
  { id: 14, question: "Will India win the 2026 ICC T20 World Cup?",          category: "Sports",  yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "sports", gradient: "linear-gradient(135deg,#2e1a0a,#3d2d0a,#1a0a2e)" },
  { id: 15, question: "Will Max Verstappen win F1 Championship 2026?",       category: "Sports",  yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "sports", gradient: "linear-gradient(135deg,#1a0a0a,#2e0a0a,#1a0a2e)" },
  // New crypto
  { id: 16, question: "Will XRP reach $10 by end of 2026?",                 category: "Crypto",  yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "btc",   gradient: "linear-gradient(135deg,#0a0a2e,#1a1a4e,#0a1a3e)" },
  { id: 17, question: "Will Dogecoin hit $1 before 2027?",                  category: "Crypto",  yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "sol",   gradient: "linear-gradient(135deg,#1a1a0a,#2d2d0a,#1a0a3e)" },
  { id: 18, question: "Will Bitcoin dominance drop below 40% in 2026?",     category: "Crypto",  yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "btc",   gradient: "linear-gradient(135deg,#0a1a0a,#1a2d1a,#0a1a2e)" },
  // Politics
  { id: 19, question: "Will the US pass a crypto regulation bill in 2026?",  category: "Politics",yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "finance",gradient: "linear-gradient(135deg,#0a0a1a,#1a1a2d,#0a1a3e)" },
  { id: 20, question: "Will the UK rejoin the EU Single Market by 2028?",   category: "Politics",yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "finance",gradient: "linear-gradient(135deg,#1a0a1a,#2d0a2d,#0a1a3e)" },
  // AI / Tech
  { id: 21, question: "Will GPT-5 be released by end of 2025?",             category: "AI",      yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "ai",    gradient: "linear-gradient(135deg,#0a1a1a,#0a2d2d,#1a0a3e)" },
  { id: 22, question: "Will Apple release AR glasses before 2027?",          category: "AI",      yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "ai",    gradient: "linear-gradient(135deg,#1a0a1a,#2d0a2d,#0a1a2e)" },
  // Finance / Science
  { id: 23, question: "Will US inflation fall below 2% in 2026?",           category: "Finance", yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "finance",gradient: "linear-gradient(135deg,#0a1a0a,#0a2d1a,#0a0a3e)" },
  { id: 24, question: "Will Tesla stock hit $500 in 2026?",                  category: "Finance", yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "finance",gradient: "linear-gradient(135deg,#1a1a0a,#2d2a0a,#0a1a3e)" },
  { id: 25, question: "Will a commercial fusion reactor go online by 2030?", category: "Science", yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "planet", gradient: "linear-gradient(135deg,#0a0a1a,#1a0a2d,#1a1a0a)" },
  // Batch 3 — Mar 2026
  { id: 26, question: "Will Arsenal win the Premier League 2025/26?",             category: "Sports",   yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "sports",  gradient: "linear-gradient(135deg,#2e0a0a,#3d0a0a,#1a0a2e)" },
  { id: 27, question: "Will Real Madrid win the Champions League 2026?",          category: "Sports",   yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "sports",  gradient: "linear-gradient(135deg,#1a1a0a,#2d2a00,#0a1a2e)" },
  { id: 28, question: "Will Lewis Hamilton win a race for Ferrari in 2026?",      category: "Sports",   yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "sports",  gradient: "linear-gradient(135deg,#2e0a0a,#1a0a0a,#1a0a2e)" },
  { id: 29, question: "Will the US establish a Bitcoin Strategic Reserve in 2026?", category: "Politics", yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "finance", gradient: "linear-gradient(135deg,#0a0a2e,#1a1a3d,#0a1a1a)" },
  { id: 30, question: "Will total crypto market cap exceed $5 trillion in 2026?", category: "Crypto",   yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "btc",    gradient: "linear-gradient(135deg,#0a1a0a,#1a2d1a,#0a0a3e)" },
  { id: 31, question: "Will there be a Ukraine ceasefire before end of 2026?",    category: "Politics", yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "finance", gradient: "linear-gradient(135deg,#0a0a1a,#1a1a2d,#1a0a0a)" },
  { id: 32, question: "Will Elon Musk launch a political party by 2027?",         category: "Politics", yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "finance", gradient: "linear-gradient(135deg,#1a1a1a,#2d2d2d,#0a1a3e)" },
  { id: 33, question: "Will Claude AI surpass ChatGPT in monthly users by 2027?", category: "AI",       yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "ai",     gradient: "linear-gradient(135deg,#0a1a1a,#0a2d2d,#1a0a3e)" },
  { id: 34, question: "Will Cardano (ADA) hit $5 before end of 2026?",            category: "Crypto",   yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "btc",    gradient: "linear-gradient(135deg,#0a0a2e,#0a1a4e,#0a1a3e)" },
  { id: 35, question: "Will a global recession be declared in 2026?",             category: "Finance",  yesPercent: 50, volume: "0 OCT", volumeNum: 0, ends: "—", participants: 0, icon: "finance", gradient: "linear-gradient(135deg,#1a0a1a,#2d0a2d,#0a1a2e)" },
];

const TRENDING = [MARKETS[0], MARKETS[1], MARKETS[2]]; // replaced by enriched.slice(0,3) in MarketsPage

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

const ADMIN_PUBKEY = '7RR7sRug2FRHaodbNsTNYZKMciLEkSH6w3qrxjZ6A256';

const MARKET_ADDRESSES: Record<string, string> = {
  '1': '5ZHfybcV5sSf7uZ6PemM2pychytL6wbXmdnwaiWbbMPp',
  '2': 'CuvChQETTNKYcnDNJwTQccQkQwJpuK8tqv3KWfwB7Jd2',
  '3': '3YpbeWS4cRgSJacfu9GunkY1MFB7TjTaZp8FbGyU13hT',
  '4': 'BZe7kfxUPYsf4QGt36Z7G9ivanfv7aeXdRyNaWZimY82',
  '5': '6j44qDgHMgyzyMAF2sWSC5DtJNtM3TUiQh7MphXLzsv7',
  '6': 'HHB7hUByh8YxJhH8DcqS5uSjHAZEgJfRqVu6YMeVtfyE',
  '7': '4jWSPtJDXBMiciGyCF6REqiYQBxNQXRrL1knfdKY18mP',
  '8': 'FD3ohDx6FBMz2b4PecAGWwJVNjk9RBtosCp9Gu75s4mm',
  '9': 'ByfnE38LZar9cM3GNAXuqhPdWjY8VqhAMZtToLKgNUA6',
  '10': '13V9xuSRiG1U9j3sEdUmxz9P9vYE6MukYGcXkMyeTyNE',
  // New markets — created Mar 8 2026
  '11': 'BGTDotZYdPt7t8wszyTNPSX4QRLBVsUvSfwouc8TYzHk',
  '12': '6LC7zEXVPGko8HoQ1hA2eULkFmBtj3XbCRmfaJAjzWnc',
  '13': 'BpZamkKDMqAX2BbNdLS53gKQe9UAxppRACnU46udetDE',
  '14': '8jpBvRcGBQFTDY3PjetoUk4vJZUi3AWBhbq3Zgd76F3X',
  '15': '66xc3Z8t2NTv35TYGSH7dczFdw9FdB16wa234PfWjnMs',
  '16': '5KKVfWFmPNEfhZ2iSUHwp6DeVtWonyAYzLswPnF2dnfE',
  '17': 'GEXcEvSZb2BndVUFABoAxxEE9CFSyCPFwVj383mBzYgX',
  '18': 'HEEfggGmfSAJUCxkLy8hbBUzr5xTzuE35SHhG5QA2J8E',
  '19': 'AoLusfxgq8mKo7h6o2GpfMPHseLYmKV18oFFnz5G7Nsc',
  '20': '1Q7DpbWhqogFG7bLrf3jHLWNZWUj3cYg1g4dutiCCZZ',
  '21': '4SyPqY8kMotZWUDtuhMmmqkSThAJnVwMVkBqLVE7syuY',
  '22': '6L1cJCvvJE1GkGELhbMMcAm9vitkiguYUbJ3wQYfP9ui',
  '23': '7X3MsG8s6nkeStK1s9roTkumReD9Hd6dFqAyVDFnYYfi',
  '24': 'DJxffSiVTrNb8PEmtXn524tcBRyQgSsnrNurW4nW482B',
  '25': 'CnhqSvCjrF1yySDZy6DSATMyE1SJtucabhDmxXgExqoM',
  // Batch 3 — Mar 2026
  '26': 'FMuf4tSBC94Fr3BhSy6ga4FXDguK2xk2PBrmhdbAXgWL',
  '27': '8ek5kvUGAUaAM6Sr6xJbDxf1Kw86S4YJ7r5SVBJppURK',
  '28': 'HtNiAsP3jo45qq3Tj7vpkCRBYeTU7dDtg9S8G2Mw3bEp',
  '29': '9D5FPJjmRpWm12tsAe8RfjFbdGefj9UxgdRQkj3LZonb',
  '30': '52CrKVyqGXxVrNSkYU8AyNXGgcrnYE3m63ffAiWrbjU9',
  '31': '59DQYBsJX22vFEA7z2soT5i4SmkaF4gFTzLUKse5683p',
  '32': 'GxACLduSPRETewhkiFnjK3MWvKtPjdKhwhj33MUrhYtA',
  '33': 'ErRPpxhBdnXZk2xwSEbFYDDsx9MTbXdxNexXKUcWVJjV',
  '34': 'E5b4kE3JyexTUboLimJcS13A4UpwNKcN7g5fB6snfPYd',
  '35': '7ihfKMprnATSsRnujMsLXJ9zKymKVtxzzoqGzNb2nuJM',
};



// ─── Pyth Price Feeds ─────────────────────────────────────────────────────────
const PYTH_FEEDS: Record<string, { id: string; label: string; target?: number }> = {
  'eth':  { id: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', label: 'ETH', target: 10000 },
  'btc':  { id: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', label: 'BTC', target: 150000 },
  'sol':  { id: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', label: 'SOL', target: 500 },
  'gold': { id: '765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2', label: 'XAU', target: 3500 },
};

// Market icon -> pyth feed key
const MARKET_PYTH_KEY: Record<number, string> = {
  1: 'btc', 2: 'sol', 3: 'btc', 4: 'sol', 6: 'eth', 7: 'sol', 9: 'gold',
};

function usePythPrices() {
  const [prices, setPrices] = useState<Record<string, number>>({});
  useEffect(() => {
    const feedIds = Object.values(PYTH_FEEDS).map(f => f.id);
    const url = `https://hermes.pyth.network/v2/updates/price/latest?${feedIds.map(id=>`ids[]=${id}`).join('&')}`;
    const fetchPrices = async () => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        const result: Record<string, number> = {};
        for (const item of data.parsed || []) {
          const entry = Object.entries(PYTH_FEEDS).find(([,f]) => f.id === item.id);
          if (!entry) continue;
          const price = parseFloat(item.price.price) * Math.pow(10, item.price.expo);
          result[entry[0]] = price;
        }
        setPrices(result);
      } catch(e) { console.error('Pyth fetch error', e); }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);
  return prices;
}

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
  @keyframes scanline{0%{transform:translateX(-100%)}100%{transform:translateX(100vw)}}
  @keyframes rotateCube{from{transform:rotateX(20deg) rotateY(0deg)}to{transform:rotateX(20deg) rotateY(360deg)}}
  @keyframes orbitRing1{from{transform:rotateX(75deg) rotateZ(0deg)}to{transform:rotateX(75deg) rotateZ(360deg)}}
  @keyframes orbitRing2{from{transform:rotateX(20deg) rotateZ(0deg)}to{transform:rotateX(20deg) rotateZ(360deg)}}
  @keyframes orbitRing3{from{transform:rotateX(50deg) rotateY(60deg) rotateZ(0deg)}to{transform:rotateX(50deg) rotateY(60deg) rotateZ(360deg)}}
  @keyframes glitch1{0%,90%,100%{clip-path:inset(50% 0 50% 0);transform:translate(0)}10%{clip-path:inset(10% 0 80% 0);transform:translate(-4px,1px)}20%{clip-path:inset(60% 0 30% 0);transform:translate(4px,-1px)}30%{clip-path:inset(30% 0 60% 0);transform:translate(-2px,2px)}40%{clip-path:inset(80% 0 10% 0);transform:translate(3px)}}
  @keyframes glitch2{0%,90%,100%{clip-path:inset(50% 0 50% 0);transform:translate(0)}10%{clip-path:inset(80% 0 10% 0);transform:translate(4px,-1px)}20%{clip-path:inset(20% 0 70% 0);transform:translate(-4px,1px)}30%{clip-path:inset(60% 0 25% 0);transform:translate(2px,-2px)}40%{clip-path:inset(10% 0 80% 0);transform:translate(-3px)}}
  @keyframes gridFade{from{opacity:0}to{opacity:1}}
  @keyframes bracketIn{from{opacity:0;transform:scale(1.3)}to{opacity:1;transform:scale(1)}}
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
  @keyframes skeletonPulse{0%,100%{opacity:.4}50%{opacity:.9}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes livePulse{0%{transform:scale(1);opacity:1}70%{transform:scale(2.2);opacity:0}100%{transform:scale(1);opacity:0}}
  .mkt-card{transition:transform .25s,box-shadow .25s,border-color .25s;cursor:pointer;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
  .mkt-card:hover{transform:translateY(-6px)!important;box-shadow:0 24px 60px rgba(124,58,237,.35),0 0 0 1px rgba(139,92,246,.35)!important;border-color:rgba(139,92,246,.4)!important}
  .trend-card{transition:transform .25s,box-shadow .25s;cursor:pointer;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
  .trend-card:hover{transform:translateY(-6px)!important;box-shadow:0 20px 50px rgba(124,58,237,.3)!important}
  .skeleton{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.09) 50%,rgba(255,255,255,.04) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:6px}
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
  @media(max-width:900px){
    .grid-4{grid-template-columns:repeat(2,1fr)!important}
    .grid-3{grid-template-columns:repeat(2,1fr)!important}
    .bottom-row{grid-template-columns:1fr!important}
    .nav-center{display:none!important}
    .stats-grid{grid-template-columns:repeat(2,1fr)!important}
  }
  @media(max-width:600px){
    .grid-4{grid-template-columns:1fr!important}
    .grid-3{grid-template-columns:1fr!important}
    .stats-grid{grid-template-columns:1fr!important}
  }
`;

// ─── Splash ───────────────────────────────────────────────────────────────────
const Splash: FC<{ onDone: () => void }> = ({ onDone }) => {
  const [pct, setPct] = useState(0);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t0 = Date.now(); const dur = 3200;
    const tick = () => {
      const p = Math.min((Date.now()-t0)/dur, 1);
      const e = p<.5 ? 2*p*p : -1+(4-2*p)*p;
      setPct(Math.floor(e*100));
      if (p<1) requestAnimationFrame(tick);
      else { setOut(true); setTimeout(onDone, 900); }
    };
    requestAnimationFrame(tick);
  }, [onDone]);

  const phase = pct<25?'ESTABLISHING CONNECTION':pct<50?'LOADING ORACLE DATA':pct<75?'SYNCING BLOCKCHAIN':pct<95?'CALIBRATING MARKETS':'READY';

  const cubeFaces = [
    { transform:'translateZ(32px)',  bg:'rgba(124,58,237,.18)', border:'rgba(124,58,237,.8)' },
    { transform:'translateZ(-32px)', bg:'rgba(124,58,237,.08)', border:'rgba(124,58,237,.4)' },
    { transform:'rotateY(90deg) translateZ(32px)',  bg:'rgba(6,182,212,.12)', border:'rgba(6,182,212,.6)' },
    { transform:'rotateY(-90deg) translateZ(32px)', bg:'rgba(6,182,212,.12)', border:'rgba(6,182,212,.6)' },
    { transform:'rotateX(90deg) translateZ(32px)',  bg:'rgba(245,158,11,.08)', border:'rgba(245,158,11,.5)' },
    { transform:'rotateX(-90deg) translateZ(32px)', bg:'rgba(245,158,11,.08)', border:'rgba(245,158,11,.5)' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#06061a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', opacity:out?0:1, transition:'opacity .9s ease', fontFamily:"'Space Grotesk',sans-serif", overflow:'hidden' }}>
      <style>{GLOBAL_CSS}</style>

      {/* Hex grid background */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(139,92,246,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.07) 1px,transparent 1px)', backgroundSize:'48px 48px', WebkitMaskImage:'radial-gradient(ellipse 70% 70% at 50% 50%,black 40%,transparent 100%)', maskImage:'radial-gradient(ellipse 70% 70% at 50% 50%,black 40%,transparent 100%)', animation:'gridFade 1.5s ease forwards' }} />

      {/* Ambient glow */}
      <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,.1),transparent 70%)', filter:'blur(80px)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }} />

      {/* Horizontal scanline */}
      <div style={{ position:'absolute', top:'30%', left:0, width:'100%', height:'1px', background:'linear-gradient(90deg,transparent,rgba(6,182,212,.7),rgba(124,58,237,.9),rgba(6,182,212,.7),transparent)', animation:'scanline 2.4s linear infinite' }} />

      {/* Corner brackets */}
      {([
        {top:24,left:24,borderTop:'2px solid rgba(139,92,246,.6)',borderLeft:'2px solid rgba(139,92,246,.6)'},
        {top:24,right:24,borderTop:'2px solid rgba(139,92,246,.6)',borderRight:'2px solid rgba(139,92,246,.6)'},
        {bottom:24,left:24,borderBottom:'2px solid rgba(139,92,246,.6)',borderLeft:'2px solid rgba(139,92,246,.6)'},
        {bottom:24,right:24,borderBottom:'2px solid rgba(139,92,246,.6)',borderRight:'2px solid rgba(139,92,246,.6)'},
      ] as React.CSSProperties[]).map((s,i)=>(
        <div key={i} style={{ position:'absolute', width:32, height:32, animation:'bracketIn .6s ease both', animationDelay:`${i*0.08}s`, ...s }} />
      ))}

      {/* 3D orbital system */}
      <div style={{ position:'relative', width:220, height:220, marginBottom:36, display:'flex', alignItems:'center', justifyContent:'center', perspective:600, perspectiveOrigin:'center' }}>

        {/* Orbital rings */}
        <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', border:'1px solid rgba(124,58,237,.55)', boxShadow:'0 0 12px rgba(124,58,237,.2)', animation:'orbitRing1 3.5s linear infinite', transformStyle:'preserve-3d' }} />
        <div style={{ position:'absolute', width:164, height:164, borderRadius:'50%', border:'1px solid rgba(6,182,212,.45)', boxShadow:'0 0 10px rgba(6,182,212,.15)', animation:'orbitRing2 5.5s linear infinite reverse' }} />
        <div style={{ position:'absolute', width:130, height:130, borderRadius:'50%', border:'1px solid rgba(245,158,11,.35)', animation:'orbitRing3 4s linear infinite' }} />

        {/* Orbiting dot on ring 1 */}
        <div style={{ position:'absolute', width:200, height:200, animation:'orbitRing1 3.5s linear infinite', borderRadius:'50%' }}>
          <div style={{ position:'absolute', top:'-4px', left:'50%', transform:'translateX(-50%)', width:8, height:8, borderRadius:'50%', background:'#7c3aed', boxShadow:'0 0 16px #7c3aed, 0 0 30px rgba(124,58,237,.5)' }} />
        </div>
        {/* Orbiting dot on ring 2 */}
        <div style={{ position:'absolute', width:164, height:164, animation:'orbitRing2 5.5s linear infinite reverse', borderRadius:'50%' }}>
          <div style={{ position:'absolute', top:'-3px', left:'50%', transform:'translateX(-50%)', width:6, height:6, borderRadius:'50%', background:'#06b6d4', boxShadow:'0 0 12px #06b6d4' }} />
        </div>

        {/* 3D cube */}
        <div style={{ width:64, height:64, position:'relative', transformStyle:'preserve-3d', animation:'rotateCube 6s linear infinite' }}>
          {cubeFaces.map((f,i)=>(
            <div key={i} style={{ position:'absolute', width:64, height:64, transform:f.transform, background:f.bg, border:`1px solid ${f.border}`, boxShadow:`inset 0 0 20px ${f.border}44` }} />
          ))}
          {/* Inner glow core */}
          <div style={{ position:'absolute', inset:8, background:'radial-gradient(circle,rgba(124,58,237,.6),transparent)', borderRadius:4, transform:'translateZ(0)' }} />
        </div>
      </div>

      {/* Logo with glitch effect */}
      <div style={{ textAlign:'center', marginBottom:44, position:'relative' }}>
        <div style={{ fontSize:10, letterSpacing:6, color:'rgba(6,182,212,.7)', textTransform:'uppercase', marginBottom:12, fontWeight:500 }}>Solana Prediction Markets</div>
        <div style={{ position:'relative', display:'inline-block' }}>
          {/* Base text */}
          <div style={{ fontSize:36, fontWeight:700, letterSpacing:8, color:'white', textTransform:'uppercase', textShadow:'0 0 40px rgba(124,58,237,.4)' }}>ORACLE MARKET</div>
          {/* Glitch layer 1 */}
          <div style={{ position:'absolute', inset:0, fontSize:36, fontWeight:700, letterSpacing:8, color:'#7c3aed', textTransform:'uppercase', animation:'glitch1 5s ease-in-out infinite', mixBlendMode:'screen' }}>ORACLE MARKET</div>
          {/* Glitch layer 2 */}
          <div style={{ position:'absolute', inset:0, fontSize:36, fontWeight:700, letterSpacing:8, color:'#06b6d4', textTransform:'uppercase', animation:'glitch2 5s ease-in-out 0.5s infinite', mixBlendMode:'screen' }}>ORACLE MARKET</div>
        </div>
      </div>

      {/* Progress section */}
      <div style={{ width:320, textAlign:'center' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:9, letterSpacing:3, color:'rgba(255,255,255,.3)', textTransform:'uppercase' }}>{phase}</div>
          <div style={{ fontSize:11, letterSpacing:2, color:'rgba(139,92,246,.8)', fontVariantNumeric:'tabular-nums', fontWeight:600 }}>{String(pct).padStart(3,'0')}%</div>
        </div>
        <div style={{ height:1, background:'rgba(255,255,255,.06)', borderRadius:1, overflow:'hidden', position:'relative' }}>
          <div style={{ height:'100%', width:pct+'%', background:'linear-gradient(90deg,#7c3aed,#06b6d4)', transition:'width .016s linear', boxShadow:'0 0 14px rgba(124,58,237,.9), 0 0 4px rgba(6,182,212,.6)' }} />
        </div>
        {/* Segment ticks */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, padding:'0 1px' }}>
          {[0,25,50,75,100].map(n=>(
            <div key={n} style={{ fontSize:8, color: pct>=n?'rgba(139,92,246,.6)':'rgba(255,255,255,.12)', letterSpacing:.5, transition:'color .3s' }}>{n}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Market Icons (SVG) ───────────────────────────────────────────────────────
const MarketIcon: FC<{ type: string; size?: number }> = ({ type, size = 36 }) => {
  const s = { width:size, height:size, display:'block', flexShrink:0 };
  const icons: Record<string, JSX.Element> = {
    eth: (
      <svg style={s} viewBox="0 0 36 36" fill="none">
        <polygon points="18,4 6,18 18,22 30,18" fill="rgba(124,58,237,.25)" stroke="#7c3aed" strokeWidth="1.4" strokeLinejoin="round"/>
        <polygon points="18,25 6,18 18,32 30,18" fill="rgba(124,58,237,.12)" stroke="#7c3aed" strokeWidth="1.4" strokeLinejoin="round"/>
        <line x1="18" y1="4" x2="18" y2="32" stroke="rgba(124,58,237,.3)" strokeWidth="1"/>
      </svg>
    ),
    btc: (
      <svg style={s} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="13" stroke="#f59e0b" strokeWidth="1.4"/>
        <path d="M14 11.5h6a3.5 3.5 0 010 7H14m0 0h6.5a3.5 3.5 0 010 7H14m0-14v14m3-15v16" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    sol: (
      <svg style={s} viewBox="0 0 36 36" fill="none">
        <defs><linearGradient id="solG" x1="0" y1="0" x2="36" y2="36"><stop stopColor="#9945ff"/><stop offset="1" stopColor="#14f195"/></linearGradient></defs>
        <path d="M9 25h18l-3 3H6l3-3zM6 16.5h21l-3 3H9l-3-3zM9 8h18l-3 3H6l3-3z" fill="url(#solG)" opacity=".9"/>
      </svg>
    ),
    vote: (
      <svg style={s} viewBox="0 0 36 36" fill="none">
        <path d="M5 31h26M8 31V17M13 31V17M23 31V17M28 31V17M18 5L4 17h28L18 5Z" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="15" y="20" width="6" height="11" stroke="#a78bfa" strokeWidth="1.4"/>
      </svg>
    ),
    ai: (
      <svg style={s} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="4" stroke="#06b6d4" strokeWidth="1.4"/>
        <circle cx="7" cy="10" r="2.5" stroke="#06b6d4" strokeWidth="1.4"/>
        <circle cx="29" cy="10" r="2.5" stroke="#06b6d4" strokeWidth="1.4"/>
        <circle cx="7" cy="26" r="2.5" stroke="#06b6d4" strokeWidth="1.4"/>
        <circle cx="29" cy="26" r="2.5" stroke="#06b6d4" strokeWidth="1.4"/>
        <path d="M9.5 11.5L14.5 15.5M21.5 15.5L26.5 11.5M9.5 24.5L14.5 20.5M21.5 20.5L26.5 24.5" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    chart: (
      <svg style={s} viewBox="0 0 36 36" fill="none">
        <polyline points="5,28 11,20 17,24 23,14 29,10" stroke="#10b981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <polyline points="25,10 29,10 29,14" stroke="#10b981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="5" y1="28" x2="31" y2="28" stroke="rgba(16,185,129,.3)" strokeWidth="1"/>
      </svg>
    ),
    sports: (
      <svg style={s} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="13" stroke="#f59e0b" strokeWidth="1.4"/>
        <path d="M18 5c3 4 3 9 0 13s-3 9 0 13M5 18c4-3 9-3 13 0s9 3 13 0" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    finance: (
      <svg style={s} viewBox="0 0 36 36" fill="none">
        <rect x="6" y="20" width="5" height="10" rx="1" fill="rgba(139,92,246,.3)" stroke="#7c3aed" strokeWidth="1.2"/>
        <rect x="15.5" y="14" width="5" height="16" rx="1" fill="rgba(139,92,246,.3)" stroke="#7c3aed" strokeWidth="1.2"/>
        <rect x="25" y="8" width="5" height="22" rx="1" fill="rgba(139,92,246,.4)" stroke="#7c3aed" strokeWidth="1.2"/>
        <path d="M8 18l7-7 7 4 8-8" stroke="#06b6d4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    planet: (
      <svg style={s} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="7" stroke="#a78bfa" strokeWidth="1.4"/>
        <ellipse cx="18" cy="18" rx="16" ry="5.5" stroke="#a78bfa" strokeWidth="1.2" opacity=".7"/>
        <ellipse cx="18" cy="18" rx="16" ry="5.5" stroke="#a78bfa" strokeWidth="1.2" opacity=".4" transform="rotate(60 18 18)"/>
      </svg>
    ),
    ar: (
      <svg style={s} viewBox="0 0 36 36" fill="none">
        <rect x="4" y="13" width="28" height="12" rx="6" stroke="#06b6d4" strokeWidth="1.4"/>
        <circle cx="13" cy="19" r="3" stroke="#06b6d4" strokeWidth="1.4"/>
        <circle cx="23" cy="19" r="3" stroke="#06b6d4" strokeWidth="1.4"/>
        <path d="M16 19h4M1 19h3M32 19h3" stroke="#06b6d4" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    doge: (
      <svg style={s} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="13" stroke="#f59e0b" strokeWidth="1.4"/>
        <path d="M13 12h7a6 6 0 010 12h-7V12Z" stroke="#f59e0b" strokeWidth="1.4" strokeLinejoin="round"/>
        <line x1="11" y1="18" x2="20" y2="18" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  };
  return icons[type] || icons['chart'];
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
    if (!amount || parseFloat(amount) <= 0) { setErr('Enter a valid amount.'); setStatus('error'); return; }
    const marketAddr = MARKET_ADDRESSES[String(market.id)];
    if (!marketAddr) { setErr('This market is not yet deployed on-chain.'); setStatus('error'); return; }
    setStatus('loading'); setErr('');
    try {
      const { PublicKey: PK, Transaction, TransactionInstruction, SystemProgram } = await import('@solana/web3.js');
      const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, ASSOCIATED_TOKEN_PROGRAM_ID } = await import('@solana/spl-token');

      const MARKET_PDA  = new PK(marketAddr);
      const [predPDA]   = PK.findProgramAddressSync([Buffer.from('prediction'), publicKey.toBuffer(), MARKET_PDA.toBuffer()], PROGRAM_ID);
      const [userProfile] = PK.findProgramAddressSync([Buffer.from('profile'), publicKey.toBuffer()], PROGRAM_ID);
      const userTA = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, publicKey);
      const vault  = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, MARKET_PDA, true);

      const tx = new Transaction();

      // Create user profile if it doesn't exist yet
      if (!await connection.getAccountInfo(userProfile)) {
        tx.add(new TransactionInstruction({
          programId: PROGRAM_ID,
          keys: [
            { pubkey: userProfile,             isSigner: false, isWritable: true },
            { pubkey: publicKey,               isSigner: true,  isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          data: Buffer.from([9, 214, 142, 184, 153, 65, 50, 174]),
        }));
      }

      // Create market vault ATA if it doesn't exist yet
      if (!await connection.getAccountInfo(vault)) {
        tx.add(createAssociatedTokenAccountInstruction(publicKey, vault, MARKET_PDA, ORACLE_TOKEN_MINT, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
      }

      const rawAmt = BigInt(Math.floor(parseFloat(amount) * 1_000_000)); // OCT 6 decimals
      const amtBuf = Buffer.alloc(8); amtBuf.writeBigUInt64LE(rawAmt, 0);
      const predExists = !!(await connection.getAccountInfo(predPDA));

      if (predExists) {
        // add_to_prediction — discriminator + amount (u64 LE)
        const disc = Buffer.from([245, 238, 134, 117, 133, 45, 175, 106]);
        tx.add(new TransactionInstruction({
          programId: PROGRAM_ID,
          keys: [
            { pubkey: predPDA,                  isSigner: false, isWritable: true },
            { pubkey: MARKET_PDA,               isSigner: false, isWritable: true },
            { pubkey: userProfile,              isSigner: false, isWritable: true },
            { pubkey: publicKey,                isSigner: true,  isWritable: true },
            { pubkey: userTA,                   isSigner: false, isWritable: true },
            { pubkey: vault,                    isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID,         isSigner: false, isWritable: false },
          ],
          data: Buffer.concat([disc, amtBuf]),
        }));
      } else {
        // makePrediction — discriminator + option_index (u8) + amount (u64 LE)
        const disc   = Buffer.from([206, 137, 238, 92, 59, 16, 13, 227]);
        const optBuf = Buffer.alloc(1); optBuf.writeUInt8(side === 'yes' ? 0 : 1, 0);
        tx.add(new TransactionInstruction({
          programId: PROGRAM_ID,
          keys: [
            { pubkey: predPDA,                  isSigner: false, isWritable: true },
            { pubkey: MARKET_PDA,               isSigner: false, isWritable: true },
            { pubkey: userProfile,              isSigner: false, isWritable: true },
            { pubkey: publicKey,                isSigner: true,  isWritable: true },
            { pubkey: userTA,                   isSigner: false, isWritable: true },
            { pubkey: vault,                    isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID,         isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId,  isSigner: false, isWritable: false },
          ],
          data: Buffer.concat([disc, optBuf, amtBuf]),
        }));
      }

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
      setTxSig(sig); setStatus('success');
    } catch (e: any) {
      const logs: string = (e?.logs || []).join('\n');
      const msg: string = e?.message || '';
      let errText = 'Transaction failed. Please try again.';
      if (logs.includes('already in use') || msg.includes('already in use')) {
        errText = 'You already have a prediction on this market.';
      } else if (logs.includes('MarketNotActive') || logs.includes('market_not_active') || logs.includes('0x1771') || logs.includes('Market is not active')) {
        errText = 'This market is already resolved and no longer accepts predictions.';
      } else if (logs.includes('insufficient') || msg.includes('insufficient')) {
        errText = 'Insufficient OCT balance.';
      } else if (logs.includes('custom program error') || msg.includes('Transaction simulation failed')) {
        errText = 'Transaction rejected by program. Market may be resolved or you may already have a prediction here.';
      } else if (msg) {
        errText = msg;
      }
      setErr(errText);
      setStatus('error');
    }
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
const MarketCard: FC<{ market: any; featured?: boolean; delay?: number; pythPrice?: number; pythLabel?: string; pythTarget?: number }> = ({ market, featured, delay = 0, pythPrice, pythLabel, pythTarget }) => {
  const [modal, setModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const yesColor = market.yesPercent >= 50 ? '#00d4aa' : '#ff6b6b';
  const noColor = market.yesPercent < 50 ? '#00d4aa' : '#ff6b6b';
  const isResolved = !!market.resolved;
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80 + delay * 60); return () => clearTimeout(t); }, [delay]);

  if (featured) return (
    <>
      <div className="trend-card" style={{ background: market.gradient, border:`1px solid ${isResolved ? 'rgba(255,255,255,.1)' : 'rgba(139,92,246,.25)'}`, borderRadius:14, padding:20, position:'relative', overflow:'hidden', minHeight:160, animation:`fadeUp .4s ease ${delay*0.08}s both`, opacity: isResolved ? 0.65 : 1 }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 70% 50%,rgba(139,92,246,.15),transparent 60%)' }} />
        {isResolved && <div style={{ position:'absolute', top:10, left:10, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', borderRadius:5, padding:'2px 8px', fontSize:9, letterSpacing:1.5, color:'rgba(255,255,255,.5)', textTransform:'uppercase', fontWeight:600 }}>Resolved</div>}
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ marginBottom:10 }}><MarketIcon type={market.icon} size={32} /></div>
          <div style={{ fontSize:15, fontWeight:600, color:'white', marginBottom:12, lineHeight:1.4 }}>{market.question}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <span style={{ fontSize:13, color:'rgba(255,255,255,.5)' }}>YES</span>
            <span style={{ fontSize:32, fontWeight:700, color:yesColor, letterSpacing:-1 }}>{market.yesPercent}%</span>
          </div>
          {isResolved ? (
            <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', borderRadius:8, padding:'9px 20px', color:'rgba(255,255,255,.4)', fontSize:13, fontWeight:600, display:'inline-block' }}>Market Closed</div>
          ) : (
            <button onClick={()=>setModal(true)} className="buy-btn" style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', border:'none', borderRadius:8, padding:'9px 20px', color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif" }}>Trade Now</button>
          )}
        </div>
        <div style={{ position:'absolute', bottom:10, right:14, fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:.5 }}>
          {market.volume} · {market.participants.toLocaleString()} traders
        </div>
        {pythPrice !== undefined && (
          <div style={{ position:'absolute', top:12, right:14, display:'flex', alignItems:'center', gap:5, background:'rgba(0,0,0,.35)', backdropFilter:'blur(6px)', borderRadius:6, padding:'3px 8px', border:'1px solid rgba(245,158,11,.25)' }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#f59e0b', boxShadow:'0 0 6px #f59e0b', animation:'pulse 2s ease-in-out infinite', display:'inline-block' }} />
            <span style={{ fontSize:10, color:'rgba(245,158,11,.9)', fontWeight:600, letterSpacing:.3 }}>{pythLabel} ${pythPrice.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0})}</span>
          </div>
        )}
      </div>
      {modal && <BetModal market={market} onClose={()=>setModal(false)} />}
    </>
  );

  return (
    <>
      <div className="mkt-card" style={{ background:'rgba(13,13,43,.45)', border:`1px solid ${isResolved ? 'rgba(255,255,255,.08)' : 'rgba(139,92,246,.18)'}`, borderRadius:14, padding:18, position:'relative', overflow:'hidden', animation:`fadeUp .4s ease ${delay*0.06}s both`, opacity: isResolved ? 0.6 : 1 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:`linear-gradient(90deg,transparent,rgba(139,92,246,.5),transparent)` }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(139,92,246,.04),transparent 60%)', pointerEvents:'none' }} />
        <div style={{ marginBottom:10 }}><MarketIcon type={market.icon} size={28} /></div>
        <div style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,.85)', marginBottom:14, lineHeight:1.45, minHeight:40 }}>{market.question}</div>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <span style={{ fontSize:22, fontWeight:700, color:yesColor }}>{market.yesPercent}%</span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>YES</span>
          <span style={{ flex:1 }} />
          <span style={{ fontSize:22, fontWeight:700, color:noColor }}>{100-market.yesPercent}%</span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>NO</span>
        </div>

        <div style={{ height:3, background:'rgba(255,255,255,.06)', borderRadius:2, marginBottom:12, overflow:'hidden' }}>
          <div style={{ height:'100%', width: mounted ? market.yesPercent+'%' : '0%', background:`linear-gradient(90deg,${yesColor},rgba(0,212,170,.3))`, borderRadius:2, transition:'width .9s cubic-bezier(.4,0,.2,1)', boxShadow:`0 0 8px ${yesColor}55` }} />
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,.35)', marginBottom: pythPrice !== undefined ? 8 : 14, alignItems:'center' }}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            {isResolved ? (
              <span style={{ fontSize:9, letterSpacing:1.5, color:'rgba(255,255,255,.3)', textTransform:'uppercase', fontWeight:600 }}>RESOLVED</span>
            ) : (
              <>
                <span style={{ position:'relative', display:'inline-block', width:6, height:6 }}>
                  <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#22c55e', animation:'livePulse 2s ease-out infinite' }} />
                  <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#22c55e' }} />
                </span>
                {market.volume}
              </>
            )}
          </span>
          <span>{isResolved ? 'Closed' : `Ends in ${market.ends}`}</span>
        </div>
        {pythPrice !== undefined && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, background:'rgba(245,158,11,.06)', border:'1px solid rgba(245,158,11,.15)', borderRadius:7, padding:'5px 10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'#f59e0b', boxShadow:'0 0 6px #f59e0b', animation:'pulse 2s ease-in-out infinite', display:'inline-block' }} />
              <span style={{ fontSize:10, color:'rgba(245,158,11,.6)', letterSpacing:1, textTransform:'uppercase' as const }}>Pyth · {pythLabel}/USD</span>
            </div>
            <div style={{ textAlign:'right' as const }}>
              <span style={{ fontSize:12, fontWeight:700, color:'rgba(245,158,11,.9)' }}>${pythPrice.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0})}</span>
              {pythTarget && <span style={{ fontSize:9, color:'rgba(255,255,255,.25)', marginLeft:5 }}>target ${pythTarget.toLocaleString()}</span>}
            </div>
          </div>
        )}

        {isResolved ? (
          <div style={{ padding:'8px 0', borderRadius:8, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'rgba(255,255,255,.3)', fontSize:11, fontWeight:600, textAlign:'center', letterSpacing:.5 }}>✓ RESOLVED</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
            <button onClick={()=>setModal(true)} className="buy-btn" style={{ padding:'8px 0', borderRadius:8, border:'1px solid rgba(0,212,170,.3)', background:'rgba(0,212,170,.1)', color:'#00d4aa', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif" }}>Buy YES</button>
            <button onClick={()=>setModal(true)} className="buy-btn" style={{ padding:'8px 0', borderRadius:8, border:'1px solid rgba(239,68,68,.3)', background:'rgba(239,68,68,.1)', color:'#ff6b6b', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif" }}>Buy NO</button>
          </div>
        )}
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
const MarketsPage: FC<{ connected: boolean; globalLiveData: Record<string,{ yesPercent:number; volume:string; totalVolume:number; resolutionTimestamp:number; title:string; resolved:boolean }> }> = ({ connected, globalLiveData }) => {
  const [cat, setCat] = useState('All');
  const [showAll, setShowAll] = useState(false);
  const liveData = globalLiveData;
  const pythPrices = usePythPrices();

  const enriched = MARKETS.map(m => {
    const live = liveData[m.id.toString()];
    if (!live) return m;
    const daysLeft = live.resolutionTimestamp > 0
      ? Math.max(0, Math.ceil((live.resolutionTimestamp * 1000 - Date.now()) / 86400000))
      : null;
    const ends = daysLeft !== null ? (daysLeft > 0 ? `${daysLeft}d` : 'Ended') : m.ends;
    return { ...m, yesPercent: live.yesPercent, volume: live.volume, volumeNum: live.totalVolume, ends, question: live.title || m.question, resolved: live.resolved };
  });

  const filtered = cat==='All' ? enriched : enriched.filter(m=>m.category===cat);
  const visibleMarkets = showAll ? filtered : filtered.slice(0, 12);
  const trending = [...enriched].sort((a,b) => (b.volumeNum||0) - (a.volumeNum||0)).slice(0,3);
  const { entries: leaderEntries } = useLeaderboardData();
  const actFeed = useRecentActivity();
  const topTraders = leaderEntries.slice(0, 3);

  return (
    <div style={{ maxWidth:1240, margin:'0 auto', padding:'28px 28px', fontFamily:"'Space Grotesk',sans-serif" }}>

      {/* Disconnected hero banner */}
      {!connected && (
        <div style={{ textAlign:'center', padding:'48px 24px 40px', marginBottom:32, background:'rgba(13,13,43,.45)', backdropFilter:'blur(12px)', border:'1px solid rgba(139,92,246,.2)', borderRadius:20, position:'relative', overflow:'hidden', animation:'fadeUp .5s ease both' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 0%,rgba(124,58,237,.12),transparent 60%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(139,92,246,.6),transparent)' }} />
          <div style={{ fontSize:48, marginBottom:16, animation:'float 4s ease-in-out infinite' }}>🔮</div>
          <h2 style={{ fontSize:28, fontWeight:700, color:'white', letterSpacing:-.5, marginBottom:10 }}>Predict the Future. Earn OCT.</h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.45)', marginBottom:28, maxWidth:460, margin:'0 auto 28px' }}>Trade on real-world outcomes using Oracle Tokens on Solana devnet. Connect your wallet to place predictions.</p>
          <div style={{ display:'flex', justifyContent:'center', gap:32, marginBottom:28 }}>
            {(() => {
              const totalVol = Object.values(liveData).reduce((s,d) => s + d.totalVolume, 0) / 1_000_000;
              const openCount = MARKETS.length - Object.values(liveData).filter(d => d.resolutionTimestamp > 0 && d.resolutionTimestamp * 1000 < Date.now()).length;
              const volStr = totalVol >= 1000 ? (totalVol/1000).toFixed(1)+'K OCT' : totalVol > 0 ? totalVol.toFixed(2)+' OCT' : '0 OCT';
              return [{v: volStr, l:'Total Volume'},{v: String(MARKETS.length), l:'Open Markets'},{v:'Solana Devnet',l:'Network'}].map((s,i)=>(
                <div key={i} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:700, color:'white', letterSpacing:-.5 }}>{s.v}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', letterSpacing:1.5, textTransform:'uppercase', marginTop:2 }}>{s.l}</div>
                </div>
              ));
            })()}
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.3)' }}>↑ Connect wallet using the button in the top right</div>
        </div>
      )}

      {/* Trending */}
      <div style={{ marginBottom:32 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#f59e0b', boxShadow:'0 0 10px #f59e0b', animation:'pulse 2s ease-in-out infinite' }} />
          <h2 style={{ fontSize:18, fontWeight:700, color:'white', letterSpacing:-.3 }}>Trending Markets</h2>
        </div>
        <div className="grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {trending.map((m,i)=>{ const pk=MARKET_PYTH_KEY[m.id]; const pf=pk?PYTH_FEEDS[pk]:undefined; return <MarketCard key={m.id} market={m} featured delay={i} pythPrice={pk?pythPrices[pk]:undefined} pythLabel={pf?.label} pythTarget={pf?.target} />; })}
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {CATEGORIES.map(c=>(
          <button key={c} onClick={()=>setCat(c)} className="cat-btn" style={{ padding:'7px 16px', borderRadius:20, border:`1px solid ${cat===c?'rgba(139,92,246,.7)':'rgba(255,255,255,.1)'}`, background: cat===c?'rgba(139,92,246,.2)':'transparent', color: cat===c?'white':'rgba(255,255,255,.5)', fontSize:13, fontWeight: cat===c?600:400, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", transition:'all .2s', display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ fontSize:11 }}>{CAT_ICONS[c]||'•'}</span>{c}
          </button>
        ))}
      </div>

      {/* Markets grid */}
      <div className="grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:16 }}>
        {visibleMarkets.map((m,i)=>{ const pk=MARKET_PYTH_KEY[m.id]; const pf=pk?PYTH_FEEDS[pk]:undefined; return <MarketCard key={m.id} market={m} delay={i%12} pythPrice={pk?pythPrices[pk]:undefined} pythLabel={pf?.label} pythTarget={pf?.target} />; })}
      </div>
      {filtered.length > 12 && (
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <button onClick={()=>setShowAll(v=>!v)} style={{ padding:'10px 28px', borderRadius:10, border:'1px solid rgba(139,92,246,.35)', background:'rgba(139,92,246,.1)', color:'rgba(139,92,246,.9)', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", transition:'all .2s' }}>
            {showAll ? '↑ Show Less' : `↓ Show All ${filtered.length} Markets`}
          </button>
        </div>
      )}

      {/* Bottom row */}
      <div className="bottom-row" style={{ display:'grid', gridTemplateColumns:'260px 1fr 300px', gap:14 }}>
        {/* Top Traders */}
        <div style={{ background:'rgba(13,13,43,.8)', border:'1px solid rgba(139,92,246,.18)', borderRadius:14, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'white', marginBottom:14 }}>🏆 Top Traders</div>
          {topTraders.length === 0 && <div style={{ fontSize:12, color:'rgba(255,255,255,.3)', textAlign:'center', padding:'12px 0' }}>Loading…</div>}
          {topTraders.map((u,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i<2?'1px solid rgba(255,255,255,.05)':'none' }}>
              <div style={{ fontSize:13, color: i===0?'#f59e0b':i===1?'rgba(200,200,200,.7)':'rgba(180,120,60,.8)', fontWeight:700, minWidth:20 }}>{i+1}.</div>
              <span style={{ fontSize:13, color:'rgba(255,255,255,.8)', flex:1, fontFamily:'monospace' }}>{shortWallet(u.pubkey)}</span>
              <span style={{ fontSize:12, color:'rgba(139,92,246,.9)', fontWeight:600 }}>{u.totalVolume.toFixed(1)} OCT</span>
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
            {actFeed.length === 0 && <div style={{ fontSize:12, color:'rgba(255,255,255,.3)', textAlign:'center', padding:'12px 0' }}>Loading…</div>}
            {actFeed.map((a,i)=>(
              <div key={i} style={{ padding:'9px 0', borderBottom: i<actFeed.length-1?'1px solid rgba(255,255,255,.05)':'none', animation:'slideIn .3s ease' }}>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.65)', lineHeight:1.5 }}>
                  <span style={{ color:'white', fontWeight:600, fontFamily:'monospace' }}>{a.wallet}</span>
                  {' bet '}
                  <span style={{ color:a.color, fontWeight:600 }}>{a.amount}</span>
                  <span style={{ color:a.color }}>{' '}{a.side}</span>
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

// ─── Shared helpers ────────────────────────────────────────────────────────────
function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now()/1000) - ts;
  if (diff < 60) return diff+'s ago';
  if (diff < 3600) return Math.floor(diff/60)+'m ago';
  if (diff < 86400) return Math.floor(diff/3600)+'h ago';
  return Math.floor(diff/86400)+'d ago';
}

function shortWallet(pk: string): string {
  return pk.slice(0,4)+'...'+pk.slice(-4);
}

type LeaderEntry = { pubkey: string; totalTokens: number; totalPredictions: number; correctPredictions: number; totalVolume: number };

function useLeaderboardData() {
  const { connection } = useConnection();
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
          filters: [{ dataSize: 225 }, { memcmp: { offset: 0, bytes: '6NrstEfxKVB' } }],
        });
        const parsed: LeaderEntry[] = accounts.map(({ account }) => {
          const d = account.data as Buffer;
          const view = new DataView(d.buffer, d.byteOffset, d.byteLength);
          const pubkey = new PublicKey(d.slice(8, 40)).toBase58();
          const totalTokens = view.getUint32(40, true) + view.getUint32(44, true) * 0x100000000;
          const totalPredictions = view.getUint32(48, true) + view.getUint32(52, true) * 0x100000000;
          const correctPredictions = view.getUint32(56, true) + view.getUint32(60, true) * 0x100000000;
          const totalVolume = (view.getUint32(64, true) + view.getUint32(68, true) * 0x100000000) / 1_000_000;
          return { pubkey, totalTokens, totalPredictions, correctPredictions, totalVolume };
        }).filter(e => e.totalPredictions > 0 || e.totalVolume > 0);
        parsed.sort((a, b) => b.totalVolume - a.totalVolume);
        setEntries(parsed);
      } catch(e) { console.error('leaderboard fetch:', e); }
      finally { setLoading(false); }
    })();
  }, [connection]);
  return { entries, loading };
}

type ActivityItem = { wallet: string; side: string; amount: string; market: string; time: string; color: string };

function useRecentActivity() {
  const { connection } = useConnection();
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const PRED_DISC = [206, 137, 238, 92, 59, 16, 13, 227];
        const MARKET_ADDR_REVERSE = Object.fromEntries(Object.entries(MARKET_ADDRESSES).map(([id, addr]) => [addr, id]));
        const sigs = await connection.getSignaturesForAddress(PROGRAM_ID, { limit: 30 });
        const txs = await Promise.all(
          sigs.slice(0, 15).map(s => connection.getTransaction(s.signature, { maxSupportedTransactionVersion: 0 }).catch(() => null))
        );
        const results: ActivityItem[] = [];
        for (const tx of txs) {
          if (!tx?.transaction || !tx.blockTime) continue;
          const msg = tx.transaction.message as any;
          const ixList = msg.compiledInstructions || msg.instructions || [];
          const keys = msg.staticAccountKeys || msg.accountKeys || [];
          for (const ix of ixList) {
            const rawData: Uint8Array = ix.data instanceof Uint8Array ? ix.data : Buffer.from(ix.data, 'base64');
            if (rawData.length < 17) continue;
            const isPredict = PRED_DISC.every((b, i) => rawData[i] === b);
            if (!isPredict) continue;
            const view = new DataView(rawData.buffer, rawData.byteOffset, rawData.byteLength);
            const optionIndex = rawData[8];
            const amountLo = view.getUint32(9, true);
            const amountHi = view.getUint32(13, true);
            const amount = (amountHi * 0x100000000 + amountLo) / 1_000_000;
            const idxList: number[] = ix.accountKeyIndexes || ix.accounts || [];
            const marketKey = keys[idxList[1]]?.toBase58?.() || '';
            const marketId = MARKET_ADDR_REVERSE[marketKey];
            const mkt = MARKETS.find(m => m.id.toString() === marketId);
            const walletKey = keys[idxList[3]]?.toBase58?.() || '';
            if (!walletKey || amount < 0.001) continue;
            results.push({
              wallet: shortWallet(walletKey),
              side: optionIndex === 0 ? 'YES' : 'NO',
              amount: amount.toFixed(0)+' OCT',
              market: (mkt?.question || `Market ${marketId || '?'}`).slice(0, 28)+'…',
              time: timeAgo(tx.blockTime),
              color: optionIndex === 0 ? '#00d4aa' : '#ff6b6b',
            });
          }
        }
        if (results.length > 0) setFeed(results.slice(0, 8));
      } catch(e) { console.error('activity feed:', e); }
    })();
  }, [connection]);
  return feed;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
const LeaderboardPage: FC<{ octBalance: number }> = ({ octBalance }) => {
  const { publicKey } = useWallet();
  const { entries, loading } = useLeaderboardData();
  const tierColor = (t:string) => t==='Oracle'?'#f59e0b':t==='Expert'?'#a78bfa':'rgba(96,165,250,.8)';
  const tierBg = (t:string) => t==='Oracle'?'rgba(245,158,11,.12)':t==='Expert'?'rgba(139,92,246,.12)':'rgba(96,165,250,.1)';
  const getTier = (vol: number) => vol > 500 ? 'Oracle' : vol > 50 ? 'Expert' : 'Novice';
  const myEntry = publicKey ? entries.find(e => e.pubkey === publicKey.toBase58()) : null;
  const myRank = myEntry ? entries.indexOf(myEntry) + 1 : null;

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 28px', fontFamily:"'Space Grotesk',sans-serif" }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:'rgba(139,92,246,.7)', textTransform:'uppercase', marginBottom:10 }}>Hall of Oracles</div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:700, color:'white', letterSpacing:-.5, marginBottom:6 }}>Leaderboard <span style={{ color:'rgba(255,255,255,.3)', fontWeight:300 }}>· top predictors</span></h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.35)' }}>Ranked by OCT volume staked on-chain · live from Solana devnet</p>
          </div>
          {myEntry && (
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(139,92,246,.2)', borderRadius:12, padding:'14px 22px', display:'flex', alignItems:'center', gap:20 }}>
              <div><div style={{ fontSize:9, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Your Rank</div><div style={{ fontSize:24, fontWeight:700, color:'white' }}>#{myRank}</div></div>
              <div style={{ width:1, height:32, background:'rgba(255,255,255,.08)' }} />
              {[{l:'Volume',v:myEntry.totalVolume.toFixed(1)+' OCT'},{l:'Predictions',v:String(myEntry.totalPredictions)}].map((s,i)=>(
                <div key={i}><div style={{ fontSize:9, color:'rgba(255,255,255,.3)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 }}>{s.l}</div><div style={{ fontSize:15, fontWeight:600, color:'white' }}>{s.v}</div></div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background:'rgba(13,13,43,.6)', border:'1px solid rgba(139,92,246,.15)', borderRadius:14, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 100px 160px 120px 100px', gap:16, padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)' }}>
          {['Rank','Wallet','Tier','Volume (OCT)','Predictions','Correct'].map((h,i)=>(
            <div key={i} style={{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:2, textTransform:'uppercase' }}>{h}</div>
          ))}
        </div>
        {loading ? (
          <div style={{ padding:32, textAlign:'center', color:'rgba(255,255,255,.25)', fontSize:13 }}>Loading on-chain data…</div>
        ) : entries.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:'rgba(255,255,255,.25)', fontSize:13 }}>No predictions on-chain yet. Be the first!</div>
        ) : entries.map((u, idx) => {
          const isMe = publicKey?.toBase58() === u.pubkey;
          const tier = getTier(u.totalVolume);
          const winRate = u.totalPredictions > 0 ? Math.round(u.correctPredictions / u.totalPredictions * 100) : 0;
          return (
            <div key={u.pubkey} className="lb-row" style={{ display:'grid', gridTemplateColumns:'60px 1fr 100px 160px 120px 100px', gap:16, padding:'13px 18px', borderBottom: idx<entries.length-1?'1px solid rgba(255,255,255,.04)':'none', alignItems:'center', background: isMe?'rgba(139,92,246,.06)':'transparent', borderLeft: isMe?'2px solid rgba(139,92,246,.5)':'2px solid transparent' }}>
              <div style={{ fontSize:13, fontWeight:700, color: idx===0?'#f59e0b':idx===1?'rgba(200,200,200,.7)':idx===2?'rgba(180,120,60,.8)':'rgba(255,255,255,.3)' }}>
                {idx<3?['01','02','03'][idx]:`#${idx+1}`}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:16 }}>🔮</span>
                <span style={{ fontSize:12, fontWeight:500, color: isMe?'rgba(139,92,246,.9)':'rgba(255,255,255,.75)', fontFamily:'monospace' }}>{shortWallet(u.pubkey)}{isMe?' (You)':''}</span>
              </div>
              <div style={{ fontSize:10, padding:'3px 9px', borderRadius:5, background:tierBg(tier), color:tierColor(tier), fontWeight:600, display:'inline-block', letterSpacing:.5, textTransform:'uppercase' }}>{tier}</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#10b981' }}>{u.totalVolume.toFixed(2)}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.5)' }}>{u.totalPredictions > 0 ? String(u.totalPredictions) : '—'}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:12, color:'rgba(255,255,255,.4)' }}>{u.correctPredictions > 0 ? winRate+'%' : '—'}</span>
                {winRate > 0 && <div style={{ flex:1, height:3, background:'rgba(255,255,255,.06)', borderRadius:2, overflow:'hidden' }}><div style={{ height:'100%', width:winRate+'%', background:'linear-gradient(90deg,#10b981,rgba(16,185,129,.4))', borderRadius:2 }} /></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Claim Rewards Tab ────────────────────────────────────────────────────────
// ── On-chain prediction type ──────────────────────────────────────────────────
type OnChainPred = {
  key: string;
  marketId: string;
  marketTitle: string;
  optionIndex: number;
  amount: number;
  claimed: boolean;
  predPDAStr: string;
  marketResolved: boolean;
  correctOptionIndex: number | null;
  won: boolean | null;
};

function parsePrediction(data: Uint8Array): { optionIndex: number; amount: number; claimed: boolean } | null {
  try {
    // 8 discriminator + 32 user + 32 market = offset 72
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const optionIndex = view.getUint8(72);
    const amountLo = view.getUint32(73, true);
    const amountHi = view.getUint32(77, true);
    const amount = amountHi * 0x100000000 + amountLo;
    const claimed = view.getUint8(89) !== 0;
    return { optionIndex, amount, claimed };
  } catch { return null; }
}

function parseMarketResolution(data: Uint8Array): { resolved: boolean; correctOptionIndex: number | null } {
  try {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const dec = new TextDecoder();
    let o = 8; // skip discriminator
    o += 8;  // market_id u64
    o += 32; // creator pubkey
    // title String (u32 len + bytes)
    const titleLen = view.getUint32(o, true); o += 4 + titleLen;
    // description String
    const descLen = view.getUint32(o, true); o += 4 + descLen;
    o += 1; // category enum u8
    // options Vec<String>
    const numOpts = view.getUint32(o, true); o += 4;
    for (let i = 0; i < numOpts; i++) { const l = view.getUint32(o, true); o += 4 + l; }
    // option_votes Vec<u64>
    const numVotes = view.getUint32(o, true); o += 4 + numVotes * 8;
    o += 8; // resolution_timestamp i64
    const status = view.getUint8(o); o += 1; // 2 = Resolved
    o += 8; // total_volume u64
    // correct_option_index Option<u8>
    const hasCorrect = view.getUint8(o); o += 1;
    const correctOptionIndex = hasCorrect ? view.getUint8(o) : null;
    return { resolved: status === 2, correctOptionIndex };
  } catch { return { resolved: false, correctOptionIndex: null }; }
}

function parseFullMarket(data: Uint8Array): { resolved: boolean; correctOptionIndex: number | null; optionVotes: number[]; totalVolume: number; resolutionTimestamp: number; title: string } {
  try {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const dec = new TextDecoder();
    let o = 8;   // discriminator
    o += 8;      // market_id u64
    o += 32;     // creator pubkey
    // title String
    const titleLen = view.getUint32(o, true); o += 4;
    const title = dec.decode(data.slice(o, o + titleLen)); o += titleLen;
    // description String
    const descLen = view.getUint32(o, true); o += 4 + descLen;
    o += 1; // category u8
    // options Vec<String>
    const numOpts = view.getUint32(o, true); o += 4;
    for (let i = 0; i < numOpts; i++) { const l = view.getUint32(o, true); o += 4 + l; }
    // option_votes Vec<u64>
    const numVotes = view.getUint32(o, true); o += 4;
    const optionVotes: number[] = [];
    for (let i = 0; i < numVotes; i++) {
      const lo = view.getUint32(o, true);
      const hi = view.getUint32(o + 4, true);
      optionVotes.push(hi * 0x100000000 + lo);
      o += 8;
    }
    // resolution_timestamp i64
    const tsLo = view.getUint32(o, true);
    const tsHi = view.getInt32(o + 4, true);
    const resolutionTimestamp = tsHi * 0x100000000 + tsLo;
    o += 8;
    // status u8 (2 = Resolved)
    const status = view.getUint8(o); o += 1;
    // total_volume u64
    const volLo = view.getUint32(o, true);
    const volHi = view.getUint32(o + 4, true);
    const totalVolume = volHi * 0x100000000 + volLo;
    o += 8;
    // correct_option_index Option<u8>
    const hasCorrect = view.getUint8(o); o += 1;
    const correctOptionIndex = hasCorrect ? view.getUint8(o) : null;
    return { resolved: status === 2, correctOptionIndex, optionVotes, totalVolume, resolutionTimestamp, title };
  } catch { return { resolved: false, correctOptionIndex: null, optionVotes: [], totalVolume: 0, resolutionTimestamp: 0, title: '' }; }
}

const ClaimRewardsTab: FC<{ onBalanceRefresh: () => void }> = ({ onBalanceRefresh }) => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [preds, setPreds] = useState<OnChainPred[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimStatus, setClaimStatus] = useState<Record<string, 'idle'|'loading'|'claimed'|'error'>>({});
  const [claimTx, setClaimTx] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!publicKey) { setPreds([]); return; }
    setLoading(true);
    (async () => {
      try {
        const { PublicKey } = await import('@solana/web3.js');
        const marketIds = Object.keys(MARKET_ADDRESSES);
        const entries = marketIds.map(id => {
          const mPDA = new PublicKey(MARKET_ADDRESSES[id]);
          const [predPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('prediction'), publicKey.toBuffer(), mPDA.toBuffer()],
            PROGRAM_ID
          );
          return { id, mPDA, predPDA };
        });
        const predInfos = await connection.getMultipleAccountsInfo(entries.map(e => e.predPDA));
        const found = entries.map((e, i) => ({ ...e, predInfo: predInfos[i] })).filter(e => e.predInfo !== null);
        if (found.length === 0) { setPreds([]); setLoading(false); return; }
        const marketInfos = await connection.getMultipleAccountsInfo(found.map(e => e.mPDA));
        const result: OnChainPred[] = [];
        for (let i = 0; i < found.length; i++) {
          const { id, predPDA, predInfo, mPDA } = found[i];
          const pred = parsePrediction(predInfo!.data as Uint8Array);
          if (!pred) continue;
          const ms = marketInfos[i] ? parseMarketResolution(marketInfos[i]!.data as Uint8Array) : { resolved: false, correctOptionIndex: null };
          const marketTitle = MARKETS.find(m => m.id.toString() === id)?.question || `Market ${id}`;
          const won = ms.resolved && ms.correctOptionIndex !== null ? pred.optionIndex === ms.correctOptionIndex : null;
          result.push({ key: id, marketId: id, marketTitle, optionIndex: pred.optionIndex, amount: pred.amount, claimed: pred.claimed, predPDAStr: predPDA.toBase58(), marketResolved: ms.resolved, correctOptionIndex: ms.correctOptionIndex, won });
        }
        setPreds(result);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [publicKey, connection, refreshKey]);

  const handleClaim = async (pred: OnChainPred) => {
    if (!publicKey) return;
    setClaimStatus(s => ({ ...s, [pred.key]: 'loading' }));
    try {
      const { PublicKey, Transaction, TransactionInstruction } = await import('@solana/web3.js');
      const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
      const marketPDA = new PublicKey(MARKET_ADDRESSES[pred.marketId]);
      const predPDA = new PublicKey(pred.predPDAStr);
      const [userProfilePDA] = PublicKey.findProgramAddressSync([Buffer.from('profile'), publicKey.toBuffer()], PROGRAM_ID);
      const [platformStatePDA] = PublicKey.findProgramAddressSync([Buffer.from('platform')], PROGRAM_ID);
      const userTokenAccount = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, publicKey);
      const marketVault = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, marketPDA, true);
      const ix = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: marketPDA,        isSigner: false, isWritable: true },
          { pubkey: predPDA,          isSigner: false, isWritable: true },
          { pubkey: userProfilePDA,   isSigner: false, isWritable: true },
          { pubkey: platformStatePDA, isSigner: false, isWritable: false },
          { pubkey: publicKey,        isSigner: true,  isWritable: true },
          { pubkey: userTokenAccount, isSigner: false, isWritable: true },
          { pubkey: marketVault,      isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.from([149, 95, 181, 242, 94, 90, 158, 162]),
      });
      const tx = new Transaction().add(ix);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash; tx.feePayer = publicKey;
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
      setClaimTx(t => ({ ...t, [pred.key]: sig }));
      setClaimStatus(s => ({ ...s, [pred.key]: 'claimed' }));
      setPreds(ps => ps.map(p => p.key === pred.key ? { ...p, claimed: true } : p));
      onBalanceRefresh();
    } catch (err: any) {
      console.error(err);
      setClaimStatus(s => ({ ...s, [pred.key]: 'error' }));
    }
  };

  const winners = preds.filter(p => p.won === true && !p.claimed);
  const alreadyClaimed = preds.filter(p => p.claimed);
  const losers = preds.filter(p => p.won === false);
  const pending = preds.filter(p => p.won === null);

  if (!publicKey) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: 13, background: 'rgba(13,13,43,.6)', border: '1px solid rgba(139,92,246,.15)', borderRadius: 14 }}>Connect your wallet to see your predictions.</div>
  );
  if (loading) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: 13, background: 'rgba(13,13,43,.6)', border: '1px solid rgba(139,92,246,.15)', borderRadius: 14 }}>Loading your predictions…</div>
  );
  if (preds.length === 0) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: 13, background: 'rgba(13,13,43,.6)', border: '1px solid rgba(139,92,246,.15)', borderRadius: 14 }}>No predictions found for this wallet.</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setRefreshKey(k => k + 1)} style={{ padding: '6px 14px', background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.3)', borderRadius: 8, color: 'rgba(139,92,246,.8)', fontSize: 11, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", letterSpacing: 1 }}>↻ Refresh</button>
      </div>
      {winners.length > 0 && (
        <div style={{ background: 'rgba(13,13,43,.6)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(16,185,129,.05)', fontSize: 11, color: 'rgba(16,185,129,.7)', letterSpacing: 2, textTransform: 'uppercase' as const }}>Winning predictions — {winners.length} claimable</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 140px', gap: 16, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)' }}>
            {['Market', 'Your Side', 'Staked', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', letterSpacing: 2, textTransform: 'uppercase' as const }}>{h}</div>
            ))}
          </div>
          {winners.map((pred, idx) => {
            const status = claimStatus[pred.key] || 'idle';
            return (
              <div key={pred.key} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 140px', gap: 16, padding: '14px 20px', borderBottom: idx < winners.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', marginBottom: 3 }}>{pred.marketTitle}</div>
                  <div style={{ fontSize: 10, color: 'rgba(16,185,129,.5)', letterSpacing: .5 }}>Resolved: {pred.correctOptionIndex === 0 ? 'YES' : 'NO'} ✓</div>
                </div>
                <div style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, background: pred.optionIndex === 0 ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)', color: pred.optionIndex === 0 ? '#10b981' : '#ef4444', fontWeight: 600, display: 'inline-block' }}>{pred.optionIndex === 0 ? 'YES' : 'NO'}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', fontWeight: 500 }}>{(pred.amount / 1_000_000).toFixed(4)} OCT</div>
                <div>
                  {status === 'claimed' ? (
                    <div style={{ fontSize: 11, color: 'rgba(16,185,129,.7)' }}>✓ Claimed {claimTx[pred.key] && <a href={`https://explorer.solana.com/tx/${claimTx[pred.key]}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ marginLeft: 6, color: 'rgba(139,92,246,.6)', fontSize: 10 }}>tx ↗</a>}</div>
                  ) : status === 'error' ? (
                    <div style={{ fontSize: 11, color: '#ef4444' }}>Failed — retry</div>
                  ) : (
                    <button onClick={() => handleClaim(pred)} disabled={status === 'loading'} style={{ padding: '7px 16px', background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 8, color: '#10b981', fontSize: 12, fontWeight: 600, cursor: status === 'loading' ? 'default' : 'pointer', fontFamily: "'Space Grotesk',sans-serif", opacity: status === 'loading' ? .6 : 1, transition: 'all .2s' }}>
                      {status === 'loading' ? 'Claiming…' : 'Claim Reward'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {winners.length === 0 && losers.length === 0 && pending.length === 0 && alreadyClaimed.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: 13, background: 'rgba(13,13,43,.6)', border: '1px solid rgba(139,92,246,.15)', borderRadius: 14 }}>No claimable rewards right now.</div>
      )}
      {pending.length > 0 && (
        <div style={{ background: 'rgba(13,13,43,.6)', border: '1px solid rgba(245,158,11,.12)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 11, color: 'rgba(245,158,11,.5)', letterSpacing: 2, textTransform: 'uppercase' as const }}>Awaiting resolution — {pending.length}</div>
          {pending.map((pred, idx) => (
            <div key={pred.key} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', gap: 16, padding: '12px 20px', borderBottom: idx < pending.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>{pred.marketTitle}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase' as const }}>{pred.optionIndex === 0 ? 'YES' : 'NO'}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>{(pred.amount / 1_000_000).toFixed(4)} OCT</div>
            </div>
          ))}
        </div>
      )}
      {losers.length > 0 && (
        <div style={{ background: 'rgba(13,13,43,.6)', border: '1px solid rgba(239,68,68,.12)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 11, color: 'rgba(239,68,68,.4)', letterSpacing: 2, textTransform: 'uppercase' as const }}>Lost predictions — {losers.length}</div>
          {losers.map((pred, idx) => (
            <div key={pred.key} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 80px', gap: 16, padding: '12px 20px', borderBottom: idx < losers.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.35)' }}>{pred.marketTitle}</div>
                <div style={{ fontSize: 10, color: 'rgba(239,68,68,.35)', marginTop: 2 }}>Resolved: {pred.correctOptionIndex === 0 ? 'YES' : 'NO'}</div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', textTransform: 'uppercase' as const }}>{pred.optionIndex === 0 ? 'YES' : 'NO'}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.2)' }}>{(pred.amount / 1_000_000).toFixed(4)} OCT</div>
              <div style={{ fontSize: 11, color: 'rgba(239,68,68,.4)' }}>— no payout</div>
            </div>
          ))}
        </div>
      )}
      {alreadyClaimed.length > 0 && (
        <div style={{ background: 'rgba(13,13,43,.6)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 11, color: 'rgba(255,255,255,.2)', letterSpacing: 2, textTransform: 'uppercase' as const }}>Already claimed — {alreadyClaimed.length}</div>
          {alreadyClaimed.map((pred, idx) => (
            <div key={pred.key} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 80px', gap: 16, padding: '12px 20px', borderBottom: idx < alreadyClaimed.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.3)' }}>{pred.marketTitle}</div>
              <div style={{ fontSize: 11, color: pred.optionIndex === 0 ? 'rgba(16,185,129,.4)' : 'rgba(239,68,68,.4)', textTransform: 'uppercase' as const }}>{pred.optionIndex === 0 ? 'YES' : 'NO'}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.2)' }}>{(pred.amount / 1_000_000).toFixed(4)} OCT</div>
              <div style={{ fontSize: 11, color: 'rgba(16,185,129,.4)' }}>✓ Claimed</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Activity / Predictions ───────────────────────────────────────────────────
// ─── Activity / Predictions ───────────────────────────────────────────────────
type ActivityPred = {
  key: string;
  marketId: string;
  marketTitle: string;
  optionIndex: number;
  amount: number;
  claimed: boolean;
  predPDAStr: string;
  marketResolved: boolean;
  correctOptionIndex: number | null;
  won: boolean | null;
  optionVotes: number[];
  totalVolume: number;
  resolutionTimestamp: number;
};

const ActivityPage: FC<{ onBalanceRefresh: () => void }> = ({ onBalanceRefresh }) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [tab, setTab] = useState<'active'|'claim'|'history'>('active');
  const [preds, setPreds] = useState<ActivityPred[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) { setPreds([]); return; }
    setLoading(true);
    (async () => {
      try {
        const { PublicKey } = await import('@solana/web3.js');
        const marketIds = Object.keys(MARKET_ADDRESSES);
        const entries = marketIds.map(id => {
          const mPDA = new PublicKey(MARKET_ADDRESSES[id]);
          const [predPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('prediction'), publicKey.toBuffer(), mPDA.toBuffer()], PROGRAM_ID
          );
          return { id, mPDA, predPDA };
        });
        const predInfos = await connection.getMultipleAccountsInfo(entries.map(e => e.predPDA));
        const found = entries.map((e, i) => ({ ...e, predInfo: predInfos[i] })).filter(e => e.predInfo !== null);
        if (found.length === 0) { setPreds([]); setLoading(false); return; }
        const marketInfos = await connection.getMultipleAccountsInfo(found.map(e => e.mPDA));
        const result: ActivityPred[] = [];
        for (let i = 0; i < found.length; i++) {
          const { id, predPDA, predInfo } = found[i];
          const pred = parsePrediction(predInfo!.data as Uint8Array);
          if (!pred) continue;
          const md = marketInfos[i] ? parseFullMarket(marketInfos[i]!.data as Uint8Array) : { resolved: false, correctOptionIndex: null, optionVotes: [0,0], totalVolume: 0, resolutionTimestamp: 0, title: '' };
          const marketTitle = md.title || MARKETS.find(m => m.id.toString() === id)?.question || `Market ${id}`;
          const won = md.resolved && md.correctOptionIndex !== null ? pred.optionIndex === md.correctOptionIndex : null;
          result.push({ key: id, marketId: id, marketTitle, optionIndex: pred.optionIndex, amount: pred.amount, claimed: pred.claimed, predPDAStr: predPDA.toBase58(), marketResolved: md.resolved, correctOptionIndex: md.correctOptionIndex, won, optionVotes: md.optionVotes, totalVolume: md.totalVolume, resolutionTimestamp: md.resolutionTimestamp });
        }
        setPreds(result);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [publicKey, connection]);

  const active = preds.filter(p => !p.marketResolved);
  const history = preds.filter(p => p.marketResolved);
  const wonCount = history.filter(p => p.won === true).length;
  const winRate = history.length > 0 ? Math.round(wonCount / history.length * 100) : 0;
  const pnl = history.reduce((s, p) => {
    if (p.won === true) {
      const totalVotes = p.optionVotes.reduce((a,b)=>a+b,0);
      const potPayout = totalVotes > 0 ? (p.amount * p.totalVolume) / p.optionVotes[p.optionIndex] : p.amount;
      return s + (potPayout - p.amount) / 1_000_000;
    }
    return s - p.amount / 1_000_000;
  }, 0);

  const formatDate = (ts: number) => ts > 0 ? new Date(ts * 1000).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';

  const emptyBox = (msg: string) => (
    <div style={{ padding:48, textAlign:'center', color:'rgba(255,255,255,.25)', fontSize:13, background:'rgba(13,13,43,.6)', border:'1px solid rgba(139,92,246,.15)', borderRadius:14 }}>{msg}</div>
  );

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 28px', fontFamily:"'Space Grotesk',sans-serif" }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:'rgba(139,92,246,.7)', textTransform:'uppercase', marginBottom:10 }}>My Activity</div>
        <h1 style={{ fontSize:28, fontWeight:700, color:'white', letterSpacing:-.5, marginBottom:20 }}>Predictions</h1>
        <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { l:'Active Bets', v: loading ? '…' : String(active.length), c:'white' },
            { l:'Total Resolved', v: loading ? '…' : String(history.length), c:'white' },
            { l:'Win Rate', v: loading ? '…' : (history.length > 0 ? winRate+'%' : '—'), c:'#10b981' },
            { l:'Total P&L', v: loading ? '…' : (history.length > 0 ? (pnl>=0?'+':'')+pnl.toFixed(2)+' OCT' : '—'), c: pnl>=0?'#10b981':'#ef4444' },
          ].map((s,i)=>(
            <div key={i} style={{ background:'rgba(13,13,43,.8)', border:'1px solid rgba(139,92,246,.15)', borderRadius:12, padding:'16px 18px' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>{s.l}</div>
              <div style={{ fontSize:22, fontWeight:700, color:s.c, letterSpacing:-.5 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:0, borderBottom:'1px solid rgba(255,255,255,.08)', marginBottom:20 }}>
        {[['active',`Active (${active.length})`],['claim','Claim Rewards'],['history',`History (${history.length})`]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t as any)} style={{ padding:'10px 22px', background:'none', border:'none', color: tab===t?'white':'rgba(255,255,255,.4)', fontSize:14, fontWeight: tab===t?600:400, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", borderBottom: tab===t?'2px solid #7c3aed':'2px solid transparent', marginBottom:-1, transition:'all .2s' }}>{l}</button>
        ))}
      </div>

      {tab==='active' && (
        loading ? emptyBox('Loading your predictions…') :
        !publicKey ? emptyBox('Connect your wallet to see your active predictions.') :
        active.length === 0 ? emptyBox('No active predictions. Place a bet on a market to get started.') : (
          <div style={{ background:'rgba(13,13,43,.6)', border:'1px solid rgba(139,92,246,.15)', borderRadius:14, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 110px 130px 120px 120px', gap:16, padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)' }}>
              {['Market','Side','Staked','Potential Win','Your Odds','Resolves'].map((h,i)=>(
                <div key={i} style={{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:2, textTransform:'uppercase' }}>{h}</div>
              ))}
            </div>
            {active.map((b,idx)=>{
              const totalVotes = b.optionVotes.reduce((a,c)=>a+c,0);
              const myOdds = totalVotes > 0 ? Math.round(b.optionVotes[b.optionIndex] / totalVotes * 100) : 50;
              const potentialWin = totalVotes > 0 ? (b.amount * b.totalVolume) / b.optionVotes[b.optionIndex] : b.amount;
              return (
                <div key={b.key} className="lb-row" style={{ display:'grid', gridTemplateColumns:'1fr 80px 110px 130px 120px 120px', gap:16, padding:'13px 18px', borderBottom: idx<active.length-1?'1px solid rgba(255,255,255,.04)':'none', alignItems:'center' }}>
                  <div><div style={{ fontSize:13, color:'rgba(255,255,255,.85)', marginBottom:2 }}>{b.marketTitle}</div><div style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>Awaiting resolution</div></div>
                  <div style={{ fontSize:11, padding:'3px 9px', borderRadius:5, background: b.optionIndex===0?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)', color: b.optionIndex===0?'#10b981':'#ef4444', fontWeight:600, display:'inline-block' }}>{b.optionIndex===0?'YES':'NO'}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,.6)', fontWeight:500 }}>{(b.amount/1_000_000).toFixed(2)} OCT</div>
                  <div style={{ fontSize:13, color:'#10b981', fontWeight:600 }}>{(potentialWin/1_000_000).toFixed(2)} OCT</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ flex:1, height:3, background:'rgba(255,255,255,.06)', borderRadius:2, overflow:'hidden' }}><div style={{ height:'100%', width:myOdds+'%', background:'linear-gradient(90deg,#10b981,rgba(16,185,129,.4))' }} /></div>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,.4)', minWidth:28 }}>{myOdds}%</span>
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{formatDate(b.resolutionTimestamp)}</div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab==='claim' && <ClaimRewardsTab onBalanceRefresh={onBalanceRefresh} />}

      {tab==='history' && (
        loading ? emptyBox('Loading…') :
        !publicKey ? emptyBox('Connect your wallet to see your history.') :
        history.length === 0 ? emptyBox('No resolved predictions yet.') : (
          <div style={{ background:'rgba(13,13,43,.6)', border:'1px solid rgba(139,92,246,.15)', borderRadius:14, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 110px 80px 120px 90px', gap:16, padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)' }}>
              {['Market','Side','Staked','Result','Resolved','P&L'].map((h,i)=>(
                <div key={i} style={{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:2, textTransform:'uppercase' }}>{h}</div>
              ))}
            </div>
            {history.map((b,idx)=>{
              const profit = b.won === true
                ? (() => { const totalVotes=b.optionVotes.reduce((a,c)=>a+c,0); const pay=totalVotes>0?(b.amount*b.totalVolume)/b.optionVotes[b.optionIndex]:b.amount; return (pay-b.amount)/1_000_000; })()
                : -b.amount/1_000_000;
              return (
                <div key={b.key} className="lb-row" style={{ display:'grid', gridTemplateColumns:'1fr 80px 110px 80px 120px 90px', gap:16, padding:'13px 18px', borderBottom: idx<history.length-1?'1px solid rgba(255,255,255,.04)':'none', alignItems:'center' }}>
                  <div><div style={{ fontSize:13, color:'rgba(255,255,255,.85)', marginBottom:2 }}>{b.marketTitle}</div><div style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>Resolved: {b.correctOptionIndex===0?'YES':'NO'}</div></div>
                  <div style={{ fontSize:11, padding:'3px 9px', borderRadius:5, background: b.optionIndex===0?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)', color: b.optionIndex===0?'#10b981':'#ef4444', fontWeight:600, display:'inline-block' }}>{b.optionIndex===0?'YES':'NO'}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,.5)' }}>{(b.amount/1_000_000).toFixed(2)} OCT</div>
                  <div style={{ fontSize:11, padding:'3px 9px', borderRadius:5, background: b.won?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)', color: b.won?'#10b981':'#ef4444', fontWeight:600, display:'inline-block' }}>{b.won?'Won':'Lost'}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{formatDate(b.resolutionTimestamp)}</div>
                  <div style={{ fontSize:14, fontWeight:700, color: profit>0?'#10b981':'#ef4444', letterSpacing:-.3 }}>{profit>0?'+':''}{profit.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

// ─── Analytics ────────────────────────────────────────────────────────────────
const CAT_NAMES: Record<number,string> = { 0:'Sports', 1:'Politics', 2:'Crypto', 3:'Entertainment', 4:'Finance', 5:'Science', 6:'AI' };
const CAT_COLORS: Record<string,string> = { Crypto:'#7c3aed', Politics:'#4f46e5', AI:'#06b6d4', Finance:'#f59e0b', Science:'#10b981', Sports:'#ef4444', Entertainment:'#ec4899' };

const AnalyticsPage: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [preds, setPreds] = useState<ActivityPred[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) { setPreds([]); return; }
    setLoading(true);
    (async () => {
      try {
        const { PublicKey } = await import('@solana/web3.js');
        const entries = Object.keys(MARKET_ADDRESSES).map(id => {
          const mPDA = new PublicKey(MARKET_ADDRESSES[id]);
          const [predPDA] = PublicKey.findProgramAddressSync([Buffer.from('prediction'), publicKey.toBuffer(), mPDA.toBuffer()], PROGRAM_ID);
          return { id, mPDA, predPDA };
        });
        const predInfos = await connection.getMultipleAccountsInfo(entries.map(e => e.predPDA));
        const found = entries.map((e,i) => ({ ...e, predInfo: predInfos[i] })).filter(e => e.predInfo !== null);
        if (!found.length) { setPreds([]); setLoading(false); return; }
        const marketInfos = await connection.getMultipleAccountsInfo(found.map(e => e.mPDA));
        const result: ActivityPred[] = [];
        for (let i = 0; i < found.length; i++) {
          const { id, predPDA, predInfo } = found[i];
          const pred = parsePrediction(predInfo!.data as Uint8Array); if (!pred) continue;
          const md = marketInfos[i] ? parseFullMarket(marketInfos[i]!.data as Uint8Array) : { resolved:false, correctOptionIndex:null, optionVotes:[0,0], totalVolume:0, resolutionTimestamp:0, title:'' };
          const marketTitle = md.title || MARKETS.find(m=>m.id.toString()===id)?.question || `Market ${id}`;
          const won = md.resolved && md.correctOptionIndex !== null ? pred.optionIndex === md.correctOptionIndex : null;
          result.push({ key:id, marketId:id, marketTitle, optionIndex:pred.optionIndex, amount:pred.amount, claimed:pred.claimed, predPDAStr:predPDA.toBase58(), marketResolved:md.resolved, correctOptionIndex:md.correctOptionIndex, won, optionVotes:md.optionVotes, totalVolume:md.totalVolume, resolutionTimestamp:md.resolutionTimestamp });
        }
        setPreds(result);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [publicKey, connection]);

  const resolved = preds.filter(p => p.marketResolved);
  const won = resolved.filter(p => p.won === true);
  const totalPnl = resolved.reduce((s,p) => {
    if (p.won) { const tv=p.optionVotes.reduce((a,b)=>a+b,0); return s + (tv>0?(p.amount*p.totalVolume/p.optionVotes[p.optionIndex]-p.amount):0)/1_000_000; }
    return s - p.amount/1_000_000;
  }, 0);
  const winRate = resolved.length > 0 ? Math.round(won.length/resolved.length*100) : 0;

  // Category breakdown from market accounts
  const catMap: Record<string,{wins:number;total:number}> = {};
  preds.forEach(p => {
    const mkt = MARKETS.find(m=>m.id.toString()===p.marketId);
    const cat = mkt?.category || 'Other';
    if (!catMap[cat]) catMap[cat] = { wins:0, total:0 };
    catMap[cat].total++;
    if (p.won === true) catMap[cat].wins++;
  });
  const categoryData = Object.entries(catMap).map(([cat,d]) => ({ cat, ...d }));
  const total = preds.length;
  const volumeData = categoryData.map((d,i) => ({ label:d.cat, pct:total>0?Math.round(d.total/total*100):0, color:CAT_COLORS[d.cat]||'#7c3aed' })).filter(d=>d.pct>0);

  // Prediction bars — show each prediction as a bar (staked amount)
  const barData = preds.map(p => ({ label: `M${p.marketId}`, val: p.amount/1_000_000, won: p.won }));
  const maxBar = Math.max(...barData.map(d=>d.val), 1);

  const donutR = 60, donutCx = 80, donutCy = 80, donutStroke = 20;
  const circumference = 2 * Math.PI * donutR;
  let offset = 0;
  const donutSlices = volumeData.map(d => {
    const len = (d.pct / 100) * circumference;
    const slice = { ...d, dashArray: `${len} ${circumference - len}`, dashOffset: -offset };
    offset += len; return slice;
  });
  const topCat = volumeData.sort((a,b)=>b.pct-a.pct)[0];

  const card = (children: React.ReactNode, extraStyle?: React.CSSProperties) => (
    <div style={{ background:'rgba(13,13,43,.8)', border:'1px solid rgba(139,92,246,.15)', borderRadius:14, padding:'22px 24px', ...extraStyle }}>{children}</div>
  );

  if (!publicKey) return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 28px', fontFamily:"'Space Grotesk',sans-serif", textAlign:'center', color:'rgba(255,255,255,.3)', paddingTop:80 }}>
      Connect your wallet to see your analytics.
    </div>
  );

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 28px', fontFamily:"'Space Grotesk',sans-serif" }}>
      <div style={{ fontSize:10, letterSpacing:3, color:'rgba(139,92,246,.7)', textTransform:'uppercase', marginBottom:8 }}>Overview</div>
      <h1 style={{ fontSize:28, fontWeight:700, color:'white', letterSpacing:-.5, marginBottom:24 }}>
        Analytics <span style={{ color:'rgba(255,255,255,.3)', fontWeight:300 }}>· performance</span>
      </h1>

      <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { l:'Total P&L', v: loading?'…': resolved.length>0?(totalPnl>=0?'+':'')+totalPnl.toFixed(2)+' OCT':'—', c: totalPnl>=0?'#10b981':'#ef4444' },
          { l:'Win Rate', v: loading?'…': resolved.length>0?winRate+'%':'—', c:'#7c3aed' },
          { l:'Total Bets', v: loading?'…':String(preds.length), c:'white' },
          { l:'Resolved', v: loading?'…':String(resolved.length), c:'#06b6d4' },
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
            <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,.6)', marginBottom:20 }}>Staked per Market (OCT)</div>
            {loading ? <div style={{ color:'rgba(255,255,255,.2)', fontSize:13 }}>Loading…</div> :
            preds.length === 0 ? <div style={{ color:'rgba(255,255,255,.2)', fontSize:13 }}>No predictions yet.</div> : (
            <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:160 }}>
              {barData.map((d,i)=>(
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,.35)', marginBottom:2 }}>{d.val.toFixed(1)}</div>
                  <div style={{ width:'100%', height:(d.val/maxBar)*130+'px', borderRadius:'4px 4px 0 0', background: d.won===true?'linear-gradient(180deg,#10b981,rgba(16,185,129,.25))':d.won===false?'linear-gradient(180deg,#ef4444,rgba(239,68,68,.25))':'linear-gradient(180deg,#7c3aed,rgba(124,58,237,.25))', boxShadow:'0 0 12px rgba(124,58,237,.3)' }} />
                  <div style={{ fontSize:9, color:'rgba(255,255,255,.25)', paddingTop:4 }}>{d.label}</div>
                </div>
              ))}
            </div>)}
          </>
        )}

        {card(
          <>
            <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,.6)', marginBottom:16 }}>Bets by Category</div>
            {loading || volumeData.length === 0 ? <div style={{ color:'rgba(255,255,255,.2)', fontSize:13 }}>No data yet.</div> : (
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <svg width={160} height={160} style={{ flexShrink:0 }}>
                <circle cx={donutCx} cy={donutCy} r={donutR} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={donutStroke} />
                {donutSlices.map((s,i)=>(
                  <circle key={i} cx={donutCx} cy={donutCy} r={donutR} fill="none"
                    stroke={s.color} strokeWidth={donutStroke}
                    strokeDasharray={s.dashArray} strokeDashoffset={s.dashOffset}
                    style={{ transform:'rotate(-90deg)', transformOrigin:`${donutCx}px ${donutCy}px` }} />
                ))}
                <text x={donutCx} y={donutCy-6} textAnchor="middle" fill="white" fontSize={18} fontWeight={700}>{topCat?.pct||0}%</text>
                <text x={donutCx} y={donutCy+12} textAnchor="middle" fill="rgba(255,255,255,.35)" fontSize={9}>{topCat?.label||''}</text>
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
            </div>)}
          </>
        )}
      </div>

      {card(
        <>
          <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,.6)', marginBottom:20 }}>Win Rate by Category</div>
          {loading || categoryData.length === 0 ? <div style={{ color:'rgba(255,255,255,.2)', fontSize:13 }}>No resolved predictions yet.</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {categoryData.map((d,i)=>{
              const rate = d.total>0?(d.wins/d.total)*100:0;
              return (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'90px 1fr 70px 60px', alignItems:'center', gap:14 }}>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,.7)', fontWeight:500 }}>{d.cat}</div>
                  <div style={{ height:6, background:'rgba(255,255,255,.06)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:rate+'%', borderRadius:3, background:'linear-gradient(90deg,#7c3aed,#06b6d4)', boxShadow:'0 0 8px rgba(124,58,237,.4)', transition:'width .6s ease' }} />
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,.35)', textAlign:'right' as const }}>{d.wins}/{d.total}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:rate>=60?'#10b981':rate>=40?'#f59e0b':'#ef4444', textAlign:'right' as const }}>{rate.toFixed(0)}%</div>
                </div>
              );
            })}
          </div>)}
        </>
      )}
    </div>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
type Page = 'markets'|'leaderboard'|'activity'|'analytics'|'create'|'admin';

const Navbar: FC<{ page:Page; setPage:(p:Page)=>void; octBalance:number; connected:boolean }> = ({ page, setPage, octBalance, connected }) => {
  const { publicKey } = useWallet();
  const isAdmin = publicKey?.toString() === ADMIN_PUBKEY;
  return (
  <header style={{ position:'sticky', top:0, zIndex:50, background:'rgba(6,6,26,.92)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(139,92,246,.15)', fontFamily:"'Space Grotesk',sans-serif" }}>
    <div style={{ maxWidth:1240, margin:'0 auto', padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between', height:58 }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={()=>setPage('markets')}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, boxShadow:'0 0 16px rgba(124,58,237,.5)' }}>🔮</div>
        <span style={{ fontSize:14, fontWeight:700, color:'white', letterSpacing:.5 }}>ORACLE MARKET</span>
      </div>
      {/* Nav */}
      <nav className="nav-center" style={{ display:'flex', gap:4 }}>
        {([['markets','Markets'],['leaderboard','Leaderboard'],['activity','Activity'],['analytics','Analytics']] as const).map(([p,l])=>(
          <button key={p} onClick={()=>setPage(p)} className={`nav-btn${page===p?' active':''}`} style={{ background:'none', border:'none', padding:'8px 16px', color: page===p?'white':'rgba(255,255,255,.5)', fontSize:14, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", fontWeight: page===p?600:400 }}>{l}</button>
        ))}
        {isAdmin && (
          <button onClick={()=>setPage('admin' as any)} className={`nav-btn${page==='admin'?' active':''}`} style={{ background:'none', border:'none', padding:'8px 16px', color: page==='admin'?'#f59e0b':'rgba(245,158,11,.5)', fontSize:14, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", fontWeight: page==='admin'?600:400 }}>⚡ Admin</button>
        )}
      </nav>
      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={()=>setPage('create')} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid rgba(139,92,246,.35)', background:'rgba(139,92,246,.1)', color:'rgba(139,92,246,.9)', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", transition:'all .2s' }}
          onMouseOver={e=>{(e.currentTarget as any).style.background='rgba(139,92,246,.2)'}}
          onMouseOut={e=>{(e.currentTarget as any).style.background='rgba(139,92,246,.1)'}}>
          + Create Market
        </button>
        {connected && (
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(139,92,246,.1)', border:'1px solid rgba(139,92,246,.25)', borderRadius:20, padding:'6px 14px', transition:'all .4s' }}>
            <div style={{ position:'relative', width:7, height:7 }}>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#22c55e', animation:'livePulse 2s ease-out infinite' }} />
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#22c55e' }} />
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:'white', fontVariantNumeric:'tabular-nums', minWidth: octBalance>0?undefined:'16px' }}>
              {octBalance > 0 ? octBalance.toLocaleString() : '—'}
            </span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>OCT</span>
          </div>
        )}
        <WalletMultiButton />
      </div>
    </div>
  </header>
  );
};

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer: FC = () => (
  <footer style={{ borderTop:'1px solid rgba(139,92,246,.1)', marginTop:64, padding:'24px 28px', fontFamily:"'Space Grotesk',sans-serif" }}>
    <div style={{ maxWidth:1240, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>🔮</div>
        <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,.5)' }}>ORACLE MARKET</span>
        <span style={{ fontSize:11, color:'rgba(255,255,255,.2)', padding:'2px 8px', borderRadius:4, border:'1px solid rgba(255,255,255,.08)', background:'rgba(255,255,255,.03)' }}>DEVNET</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,.2)', letterSpacing:1.5, textTransform:'uppercase' }}>Program ID</div>
        <code style={{ fontSize:11, color:'rgba(139,92,246,.6)', fontFamily:'monospace', letterSpacing:.5 }}>HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj</code>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <a href="https://explorer.solana.com/address/HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj?cluster=devnet" target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:'rgba(139,92,246,.6)', textDecoration:'none' }}>Explorer ↗</a>
        <span style={{ fontSize:11, color:'rgba(255,255,255,.15)' }}>Built on Solana · Anchor 0.30.1</span>
      </div>
    </div>
  </footer>
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

// ─── Admin Page ───────────────────────────────────────────────────────────────
const AdminPage: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [resolveStatus, setResolveStatus] = useState<Record<string, 'idle'|'loading'|'resolved'|'error'>>({});
  const [resolveTx, setResolveTx] = useState<Record<string, string>>({});
  const [resolvedOption, setResolvedOption] = useState<Record<string, number>>({});
  const [adminMarketData, setAdminMarketData] = useState<Record<string,{ volume:string; status:number; correctOption:number|null }>>({});

  useEffect(() => {
    (async () => {
      try {
        const { PublicKey } = await import('@solana/web3.js');
        const entries = Object.entries(MARKET_ADDRESSES).map(([id, addr]) => ({ id, pda: new PublicKey(addr) }));
        const infos = await connection.getMultipleAccountsInfo(entries.map(e => e.pda));
        const data: Record<string,{ volume:string; status:number; correctOption:number|null }> = {};
        entries.forEach(({ id }, i) => {
          const info = infos[i]; if (!info) return;
          const md = parseFullMarket(info.data as Uint8Array);
          const volOCT = md.totalVolume / 1_000_000;
          const volume = volOCT >= 1000 ? (volOCT/1000).toFixed(1)+'K OCT' : volOCT > 0 ? volOCT.toFixed(2)+' OCT' : '0 OCT';
          data[id] = { volume, status: md.resolved ? 2 : 0, correctOption: md.correctOptionIndex };
        });
        setAdminMarketData(data);
      } catch(e) { console.error(e); }
    })();
  }, [connection]);

  const handleResolve = async (marketId: string, optionIndex: number) => {
    if (!publicKey) return;
    setResolveStatus(s => ({ ...s, [marketId]: 'loading' }));
    try {
      const { PublicKey, Transaction, TransactionInstruction } = await import('@solana/web3.js');
      const marketPDA = new PublicKey(MARKET_ADDRESSES[marketId]);
      const [platformStatePDA] = PublicKey.findProgramAddressSync([Buffer.from('platform')], PROGRAM_ID);
      // admin_resolve_market discriminator: sha256("global:admin_resolve_market")[..8]
      const disc = Buffer.from([95, 0, 240, 167, 32, 165, 176, 233]);
      const optBuf = Buffer.alloc(1); optBuf.writeUInt8(optionIndex, 0);
      const ix = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: marketPDA,        isSigner: false, isWritable: true },
          { pubkey: platformStatePDA, isSigner: false, isWritable: false },
          { pubkey: publicKey,        isSigner: true,  isWritable: true },
        ],
        data: Buffer.concat([disc, optBuf]),
      });
      const tx = new Transaction().add(ix);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash; tx.feePayer = publicKey;
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
      setResolveTx(t => ({ ...t, [marketId]: sig }));
      setResolvedOption(r => ({ ...r, [marketId]: optionIndex }));
      setResolveStatus(s => ({ ...s, [marketId]: 'resolved' }));
    } catch (err: any) {
      console.error(err);
      setResolveStatus(s => ({ ...s, [marketId]: 'error' }));
    }
  };

  const resolvableMarkets = MARKETS.filter(m => MARKET_ADDRESSES[m.id.toString()]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 28px', fontFamily: "'Space Grotesk',sans-serif" }}>
      <div style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(245,158,11,.7)', textTransform: 'uppercase', marginBottom: 8 }}>Admin</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'white', letterSpacing: -.5, marginBottom: 6 }}>Resolve Markets</h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 28 }}>Admin-only · {resolvableMarkets.length} markets with on-chain addresses</p>

      {!publicKey && (
        <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 13, background: 'rgba(13,13,43,.6)', border: '1px solid rgba(139,92,246,.15)', borderRadius: 14 }}>
          Connect your admin wallet to resolve markets.
        </div>
      )}

      {publicKey && (
        <div style={{ background: 'rgba(13,13,43,.6)', border: '1px solid rgba(139,92,246,.15)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 120px 200px', gap: 16, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)' }}>
            {['Market', 'Category', 'Volume', 'Status', 'Action'].map((h, i) => (
              <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', letterSpacing: 2, textTransform: 'uppercase' as const }}>{h}</div>
            ))}
          </div>
          {resolvableMarkets.map((market, idx) => {
            const status = resolveStatus[market.id.toString()] || 'idle';
            const isResolved = status === 'resolved';
            const isLoading = status === 'loading';
            const winOption = resolvedOption[market.id.toString()];
            return (
              <div key={market.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 120px 200px', gap: 16, padding: '16px 20px', borderBottom: idx < resolvableMarkets.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: isResolved ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.85)', marginBottom: 2 }}>{market.question}</div>
                  {isResolved && resolveTx[market.id.toString()] && (
                    <a href={`https://explorer.solana.com/tx/${resolveTx[market.id.toString()]}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: 'rgba(139,92,246,.6)' }}>tx ↗</a>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{market.category}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{adminMarketData[market.id.toString()]?.volume ?? '…'}</div>
                <div>
                  {(() => {
                    const onChain = adminMarketData[market.id.toString()];
                    const resolved = isResolved || onChain?.status === 2;
                    const opt = isResolved ? winOption : onChain?.correctOption;
                    return resolved ? (
                      <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, background: 'rgba(16,185,129,.12)', color: '#10b981', fontWeight: 600 }}>
                        {opt === 0 ? 'YES' : opt === 1 ? 'NO' : '?'} ✓
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, background: 'rgba(245,158,11,.1)', color: 'rgba(245,158,11,.8)', fontWeight: 600 }}>Active</span>
                    );
                  })()}
                </div>
                <div>
                  {isResolved ? (
                    <span style={{ fontSize: 11, color: 'rgba(16,185,129,.5)' }}>✓ Done</span>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleResolve(market.id.toString(), 0)} disabled={isLoading} style={{ padding: '7px 16px', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 8, color: '#10b981', fontSize: 12, fontWeight: 600, cursor: isLoading ? 'default' : 'pointer', opacity: isLoading ? .5 : 1, fontFamily: "'Space Grotesk',sans-serif", transition: 'all .2s' }}>
                        {isLoading ? '…' : 'YES'}
                      </button>
                      <button onClick={() => handleResolve(market.id.toString(), 1)} disabled={isLoading} style={{ padding: '7px 16px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: isLoading ? 'default' : 'pointer', opacity: isLoading ? .5 : 1, fontFamily: "'Space Grotesk',sans-serif", transition: 'all .2s' }}>
                        {isLoading ? '…' : 'NO'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
const MainApp: FC = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [page, setPage] = useState<Page>('markets');
  const [octBalance, setOctBalance] = useState(0);
  const [globalLiveData, setGlobalLiveData] = useState<Record<string,{ yesPercent:number; volume:string; totalVolume:number; resolutionTimestamp:number; title:string; resolved:boolean }>>({});

  const fetchOctBalance = useCallback(async () => {
    if (!publicKey) { setOctBalance(0); return; }
    try {
      const { getAssociatedTokenAddress } = await import('@solana/spl-token');
      const ata = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, publicKey);
      const info = await connection.getTokenAccountBalance(ata);
      setOctBalance(Math.floor(info.value.uiAmount || 0));
    } catch { setOctBalance(0); }
  }, [publicKey, connection]);

  // Global market data fetch — always running regardless of page
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const { PublicKey } = await import('@solana/web3.js');
        const entries = Object.entries(MARKET_ADDRESSES).map(([id, addr]) => ({ id, pda: new PublicKey(addr) }));
        const infos = await connection.getMultipleAccountsInfo(entries.map(e => e.pda));
        const live: Record<string,{ yesPercent:number; volume:string; totalVolume:number; resolutionTimestamp:number; title:string }> = {};
        entries.forEach(({ id }, i) => {
          const info = infos[i]; if (!info) return;
          const md = parseFullMarket(info.data as Uint8Array);
          const totalVotes = md.optionVotes.reduce((a,b)=>a+b,0);
          const yesPercent = totalVotes > 0 ? Math.round(md.optionVotes[0] / totalVotes * 100) : 50;
          const volOCT = md.totalVolume / 1_000_000;
          const volume = volOCT >= 1000 ? (volOCT/1000).toFixed(1)+'K OCT' : volOCT > 0 ? volOCT.toFixed(2)+' OCT' : '0 OCT';
          live[id] = { yesPercent, volume, totalVolume: md.totalVolume, resolutionTimestamp: md.resolutionTimestamp, title: md.title, resolved: md.resolved };
        });
        setGlobalLiveData(live);
      } catch(e) { console.error(e); }
    };
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 20000);
    return () => clearInterval(interval);
  }, [connection]);

  useEffect(() => { fetchOctBalance(); }, [fetchOctBalance]);
  useEffect(() => { if (!connected) setOctBalance(0); }, [connected]);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <SpaceBg />
      <Navbar page={page} setPage={setPage} octBalance={octBalance} connected={connected} />
      {page==='markets' && <MarketsPage connected={connected} globalLiveData={globalLiveData} />}
      {page==='leaderboard' && <LeaderboardPage octBalance={octBalance} />}
      {page==='activity' && <ActivityPage onBalanceRefresh={fetchOctBalance} />}
      {page==='analytics' && <AnalyticsPage />}
      {page==='create' && <CreateMarketPage />}
      {page==='admin' && <AdminPage />}
      <Footer />
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

