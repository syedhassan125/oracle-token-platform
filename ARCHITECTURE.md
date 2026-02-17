# 🏗️ Oracle Token - System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       USER INTERFACE                         │
│  (Web App / Mobile App / CLI)                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    TYPESCRIPT SDK                            │
│  • OracleTokenClient                                        │
│  • Market Management                                        │
│  • Prediction Logic                                         │
│  • Profile Management                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    SOLANA RUNTIME                            │
│  • Transaction Processing                                   │
│  • Account Management                                       │
│  • SPL Token Integration                                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              ORACLE TOKEN SMART CONTRACT                     │
│  (Rust Program on Solana)                                  │
└─────────────────────────────────────────────────────────────┘
```

## Smart Contract Components

### 1. Program Data Structures

```
┌─────────────────────┐
│   PlatformState     │
├─────────────────────┤
│ • authority         │
│ • token_mint        │
│ • platform_fee_bps  │
│ • total_markets     │
└─────────────────────┘

┌─────────────────────┐        ┌─────────────────────┐
│      Market         │        │     UserProfile     │
├─────────────────────┤        ├─────────────────────┤
│ • market_id         │        │ • user              │
│ • creator           │        │ • total_tokens      │
│ • title             │        │ • total_predictions │
│ • description       │        │ • correct_pred.     │
│ • category          │        │ • category_tokens   │
│ • options           │        │ • category_correct  │
│ • option_votes      │        │ • markets_created   │
│ • resolution_time   │        └─────────────────────┘
│ • status            │
│ • total_volume      │        ┌─────────────────────┐
│ • correct_option    │        │    Prediction       │
└─────────────────────┘        ├─────────────────────┤
                               │ • user              │
                               │ • market            │
                               │ • option_index      │
                               │ • amount            │
                               │ • timestamp         │
                               │ • claimed           │
                               └─────────────────────┘
```

## User Journey Flow

### New User Onboarding
```
1. Connect Wallet
   ↓
2. Create User Profile
   ↓
3. Explore Active Markets
   ↓
4. Make First Prediction (Novice Tier)
   ↓
5. Earn Oracle Tokens (if correct)
   ↓
6. Unlock Features as Tokens Grow
```

### Tier Progression System
```
Novice (0 tokens)
    ↓ Make accurate predictions
    ↓ Earn Oracle Tokens
Basic Holder (100+ tokens)
    ↓ Vote on disputes
    ↓ Continue predicting
Expert Predictor (1,000+ tokens)
    ↓ Create markets
    ↓ Resolve disputes
Oracle Status (10,000+ tokens)
    ↓ Resolve markets
    ↓ Earn staking fees
```

## Market Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  MARKET CREATION (by Expert/Oracle)                         │
│  • Define question & options                                │
│  • Set resolution date                                      │
│  • Choose category                                          │
│  • Pay creation fee (100 tokens)                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  ACTIVE MARKET                                              │
│  • Users make predictions                                   │
│  • Stake tokens on options                                 │
│  • Volume accumulates                                       │
│  • Early predictions get bonus                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  RESOLUTION TRIGGERED (after deadline)                      │
│  • Oracle (10k+ tokens) resolves                           │
│  • Correct option identified                               │
│  • Move to PendingResolution                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  DISPUTE PERIOD (optional, 24-48 hours)                    │
│  • Token holders can challenge                             │
│  • Vote with weighted tokens                               │
│  • Wrong voters get slashed                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  FINALIZED                                                  │
│  • Winners claim rewards                                    │
│  • Earn Oracle Tokens based on:                            │
│    - Early bird bonus (2x if first)                        │
│    - Difficulty score (3x if contrarian)                   │
│  • Losers forfeit stake                                    │
└─────────────────────────────────────────────────────────────┘
```

## Oracle Token Economics

### Token Flow Diagram
```
                    ┌──────────────────┐
                    │   New Prediction │
                    │   (Stake Tokens) │
                    └────────┬─────────┘
                             │
                ┌────────────▼───────────┐
                │   Market Vault         │
                │   (Holds All Stakes)   │
                └────────────┬───────────┘
                             │
                    ┌────────▼────────┐
                    │  Market Resolves │
                    └────────┬─────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
        ┌────────▼────────┐    ┌────────▼────────┐
        │  Correct Bets   │    │  Incorrect Bets │
        │  Get Rewarded   │    │  Lose Stakes    │
        └────────┬────────┘    └─────────────────┘
                 │
        ┌────────▼────────┐
        │  Earn New       │
        │  Oracle Tokens  │
        └─────────────────┘
```

### Reward Calculation
```
Oracle_Tokens_Earned = Base_Amount × Early_Bird_Bonus × Difficulty_Score

Early_Bird_Bonus:
├─ First 10% of time: 2.0x
├─ 10-30% of time:    1.75x
├─ 30-60% of time:    1.5x
├─ 60-90% of time:    1.25x
└─ Last 10% of time:  1.0x

Difficulty_Score:
├─ <10% chose option:  3.0x (highly contrarian)
├─ 10-20% chose:       2.5x
├─ 20-40% chose:       1.5x
├─ 40-60% chose:       1.0x
└─ >60% chose:         0.6x (obvious choice)
```

## Security Model

### Anti-Manipulation Safeguards
```
1. Slashing Mechanism
   ├─ Wrong dispute votes → Lose 10% of staked tokens
   └─ Prevents frivolous challenges

2. Time Decay
   ├─ 3% quarterly decay if inactive
   └─ Keeps credentials fresh

3. Category Specialization
   ├─ Separate token counts per category
   └─ Can't be crypto expert and vote on sports

4. Market Creation Barrier
   ├─ Requires 1,000+ tokens
   └─ Prevents spam markets

5. Oracle Requirements
   ├─ Need 10,000+ tokens to resolve
   └─ Ensures experienced resolvers
```

### Account Structure (Program Derived Addresses)
```
Platform State
├─ Seeds: ["platform"]
└─ Authority: Program deployer

User Profile
├─ Seeds: ["profile", user_pubkey]
└─ Owner: User

Market
├─ Seeds: ["market", market_id]
└─ Creator: Market creator

Prediction
├─ Seeds: ["prediction", user_pubkey, market_pubkey]
└─ Owner: User who made prediction

Market Vault (Token Account)
├─ Associated Token Account
└─ Authority: Market PDA
```

## Integration Points

### For dApp Developers
```typescript
// 1. Initialize Client
const client = await createOracleTokenClient(connection, wallet, programId);

// 2. Create Profile
await client.createUserProfile();

// 3. Query User's Reputation
const profile = await client.getUserProfile(userPublicKey);
console.log(`Oracle Tokens: ${profile.totalTokens}`);
console.log(`Accuracy: ${profile.correctPredictions / profile.totalPredictions}`);

// 4. Use Reputation for Access Control
if (profile.totalTokens >= 10000) {
  // Grant Oracle-level permissions
  allowMarketResolution();
} else if (profile.totalTokens >= 1000) {
  // Grant Expert-level permissions
  allowMarketCreation();
}
```

### For External Platforms
```javascript
// Use Oracle Tokens as reputation layer
// Example: Lending protocol checking borrower credibility

async function checkUserCredibility(userAddress) {
  const profile = await oracleClient.getUserProfile(userAddress);
  
  if (!profile) return { credible: false, score: 0 };
  
  const accuracyScore = profile.correctPredictions / profile.totalPredictions;
  const tokenScore = Math.log(profile.totalTokens + 1);
  const volumeScore = Math.log(profile.totalVolume + 1);
  
  const credibilityScore = (accuracyScore * 0.5) + (tokenScore * 0.3) + (volumeScore * 0.2);
  
  return {
    credible: credibilityScore > 0.6,
    score: credibilityScore,
    tokens: profile.totalTokens,
    accuracy: accuracyScore
  };
}
```

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE                            │
│  • CDN & DDoS Protection                                    │
│  • HTTPS Termination                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     WEB SERVER (Vercel)                      │
│  • Next.js Frontend                                         │
│  • Server-Side Rendering                                    │
│  • API Routes                                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
┌──────────────┐    ┌──────────────┐
│ Solana RPC   │    │  PostgreSQL  │
│ (QuickNode)  │    │  (Supabase)  │
│              │    │              │
│ • Mainnet    │    │ • User data  │
│ • Devnet     │    │ • Analytics  │
└──────────────┘    └──────────────┘
```

## Monitoring & Analytics

### Key Metrics to Track
```
Platform Health:
├─ Total Markets Created
├─ Active Users
├─ Total Volume Traded
├─ Oracle Token Supply
└─ Average Accuracy Rate

Market Health:
├─ Markets by Category
├─ Resolution Success Rate
├─ Dispute Frequency
├─ Average Time to Resolve
└─ Participation Rate

User Behavior:
├─ Token Distribution
├─ Tier Breakdown
├─ Retention Rate
├─ Accuracy Trends
└─ Category Preferences
```

## Future Enhancements

### Phase 2 (Q2 2025)
- Multi-signature market resolution
- Prediction pools & syndicates
- Advanced charting & analytics
- Mobile apps (iOS/Android)

### Phase 3 (Q3 2025)
- Cross-chain oracle reputation
- Market insurance mechanisms
- AI prediction assistance
- Institutional partnerships

### Phase 4 (Q4 2025)
- Full DAO governance
- Open oracle network
- Enterprise API
- Multi-chain expansion

---

**For technical questions or architecture discussions:**
- GitHub: github.com/oracletoken
- Discord: discord.gg/oracletoken
- Docs: docs.oracletoken.io
