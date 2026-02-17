# 🔮 Oracle Token - Prediction Market with Reputation Credentials

A revolutionary Solana-based prediction market where your accuracy earns you **Oracle Tokens** - a transferable credential that represents your forecasting skill and unlocks progressive platform benefits.

## 🌟 What Makes This Unique

Unlike traditional prediction markets that only offer monetary rewards, Oracle Token creates a **reputation economy**:

- **Earn Through Accuracy**: Correct predictions earn you Oracle Tokens based on early conviction and difficulty
- **Progressive Power**: More tokens = more privileges (voting, market creation, resolution authority)
- **Transferable Reputation**: Your Oracle Tokens prove your judgment across platforms
- **Anti-Gaming**: Time decay and category specialization prevent manipulation
- **Community Governance**: Token holders govern dispute resolution and platform parameters

## 🎯 Token Utility Tiers

### Tier 1 - Basic Holder (100+ tokens)
- ✅ Vote on disputed market resolutions
- ✅ Access advanced market analytics
- ✅ Reduced trading fees (0.5% vs 2%)
- ✅ Basic profile statistics

### Tier 2 - Expert Predictor (1,000+ tokens)
- ✅ **Create new prediction markets**
- ✅ Earn fees from markets you create
- ✅ Higher voting weight in disputes
- ✅ Access to expert-only high-stakes markets
- ✅ Advanced analytics & API access

### Tier 3 - Oracle Status (10,000+ tokens)
- ✅ **Become an official market resolver**
- ✅ Stake tokens to validate outcomes (earn fees)
- ✅ Quality control & market whitelist powers
- ✅ Governance voting on platform parameters
- ✅ Premium features & early access

## 📊 How Oracle Tokens Are Earned

When you make a **correct prediction**, you earn Oracle Tokens calculated by:

```
Oracle Tokens = Base_Amount × Early_Bird_Bonus × Difficulty_Score
```

### Early Bird Bonus (1x - 2x)
Predict early = higher multiplier
- Predict at market start: **2x bonus**
- Predict at midpoint: **1.5x bonus**
- Predict near deadline: **1x bonus**

### Difficulty Score (0.55x - 3x)
Contrarian bets = higher rewards
- 10% of bets on your option: **3x multiplier**
- 50% of bets on your option: **1x multiplier**
- 90% of bets on your option: **0.55x multiplier**

This incentivizes early conviction and rewards those who correctly predict unlikely outcomes.

## 🏗️ Architecture

### Smart Contract Components

1. **Platform State** - Global configuration and statistics
2. **Markets** - Individual prediction markets with options
3. **Predictions** - User bets on market outcomes
4. **User Profiles** - Reputation tracking per user and category
5. **Dispute System** - Community governance for contested resolutions

### Key Features

- ⚡ **Fast & Cheap**: Built on Solana for high-speed, low-cost transactions
- 🔒 **Secure**: Audited smart contracts with anti-manipulation safeguards
- 🌐 **Decentralized**: No central authority controls outcomes
- 📈 **Transparent**: All predictions and resolutions on-chain
- 🎓 **Category Expertise**: Track record by domain (Sports, Politics, Crypto, etc.)

## 🚀 Getting Started

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

# Install Node.js dependencies
npm install
```

### Configuration

```bash
# Set Solana cluster (localnet, devnet, or mainnet)
solana config set --url https://api.devnet.solana.com

# Generate a new keypair (or use existing)
solana-keygen new

# Get some SOL for testing
solana airdrop 2
```

### Build & Deploy

```bash
# Build the program
anchor build

# Run tests
anchor test

# Deploy to configured cluster
./deploy.sh
```

### Initialize Platform

```bash
# Create Oracle Token SPL mint first
spl-token create-token --decimals 6

# Initialize platform (update MINT_ADDRESS)
anchor run initialize -- --mint-address YOUR_MINT_ADDRESS
```

## 💻 Usage Examples

### JavaScript/TypeScript Client

```typescript
import { OracleTokenClient, MarketCategory } from './client';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

// Connect to cluster
const connection = new Connection('https://api.devnet.solana.com');
const wallet = new Wallet(Keypair.generate());
const programId = new PublicKey('YOUR_PROGRAM_ID');

// Create client
const client = await createOracleTokenClient(connection, wallet, programId);

// Create user profile
await client.createUserProfile();

// Create a market (requires 1000+ Oracle Tokens)
await client.createMarket(
  1, // marketId
  "Will ETH reach $5k in Q1 2025?",
  "Resolves YES if ETH hits $5,000 at any point in Q1 2025",
  MarketCategory.Crypto,
  Math.floor(Date.now() / 1000) + 7776000, // 90 days
  ["Yes", "No"]
);

// Make a prediction
await client.makePrediction(
  1, // marketId
  0, // optionIndex (Yes)
  1000000, // amount (1 token with 6 decimals)
  oracleTokenMint
);

// Resolve market (requires Oracle status: 10,000+ tokens)
await client.resolveMarket(1, 0); // Correct option is index 0

// Claim rewards
await client.claimReward(1, oracleTokenMint);

// Check profile
const profile = await client.getUserProfile(wallet.publicKey);
console.log('Oracle Tokens:', profile.totalTokens);
console.log('Accuracy:', profile.correctPredictions / profile.totalPredictions);
```

## 📁 Project Structure

```
oracle-token-solana/
├── lib.rs              # Main Solana program (smart contract)
├── client.ts           # TypeScript SDK for client applications
├── test.ts             # Comprehensive test suite
├── deploy.sh           # Deployment script
├── Anchor.toml         # Anchor configuration
├── Cargo.toml          # Rust dependencies
└── README.md           # This file
```

## 🔐 Security Features

### Anti-Manipulation Safeguards

1. **Slashing**: Wrong dispute votes lose tokens
2. **Time Decay**: Inactive tokens decrease 3% per quarter
3. **Category Specialization**: Expertise tracked per domain
4. **Market Creation Barrier**: Requires 1000+ tokens
5. **Oracle Requirements**: Resolvers need 10,000+ tokens

### Auditing

- [ ] Code review by security experts
- [ ] Formal verification of critical functions
- [ ] Bug bounty program
- [ ] Gradual rollout with monitoring

## 🎮 Market Categories

- 🏈 **Sports**: NFL, NBA, FIFA, Olympics, etc.
- 🏛️ **Politics**: Elections, policy decisions, appointments
- ₿ **Crypto**: Price predictions, protocol launches, regulations
- 🎬 **Entertainment**: Box office, awards, streaming metrics
- 💻 **Technology**: Product launches, AI milestones, breakthroughs
- 📊 **Economics**: GDP, inflation, market movements
- 🔬 **Science**: Research outcomes, discoveries, space missions
- 🌐 **Other**: Miscellaneous topics

## 🗺️ Roadmap

### Phase 1: MVP (Current)
- ✅ Core smart contracts
- ✅ Basic token mechanics
- ✅ Market creation & resolution
- ✅ Reputation tracking

### Phase 2: Enhanced Features
- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Social features (profiles, following)
- [ ] Market templates & categories
- [ ] API for third-party integration

### Phase 3: Ecosystem Growth
- [ ] Cross-platform reputation (integrate with other dApps)
- [ ] Prediction pools & syndicates
- [ ] Market insurance mechanisms
- [ ] Educational content & tutorials
- [ ] Partnerships with data providers

### Phase 4: Full Decentralization
- [ ] DAO governance launch
- [ ] Community-driven roadmap
- [ ] Open oracle network
- [ ] Multi-chain expansion
- [ ] Enterprise offerings

## 💡 Use Cases

### For Individuals
- **Build Reputation**: Showcase forecasting skills
- **Earn Passive Income**: Correct predictions = tokens + governance fees
- **Access Premium Markets**: Unlock exclusive high-stakes opportunities
- **Governance Rights**: Shape platform direction

### For Organizations
- **Employee Assessment**: Evaluate decision-making skills
- **Market Research**: Crowdsource predictions on business questions
- **Risk Management**: Hedge against uncertain outcomes
- **Recruitment Tool**: Identify talent with proven judgment

### For Developers
- **Integration**: Use Oracle Tokens as reputation layer
- **API Access**: Build on top of prediction infrastructure
- **White Label**: Deploy custom prediction markets
- **Data Feed**: Access aggregated forecast data

## 📊 Tokenomics

### Token Distribution
- **Prediction Rewards**: 60% (earned through accurate predictions)
- **Oracle Staking**: 20% (earned by market resolvers)
- **Platform Treasury**: 10% (for development & marketing)
- **Team & Advisors**: 10% (4-year vesting)

### Fee Structure
- **Trading Fee**: 2% of market volume (0.5% for 100+ token holders)
- **Market Creation**: 100 Oracle Tokens (burned)
- **Resolution Rewards**: 5% of market volume to oracle resolvers

### Deflationary Mechanisms
- Market creation fees burned
- Slashed tokens from incorrect disputes
- Time decay on inactive accounts

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Code**: Submit PRs for features or bug fixes
2. **Documentation**: Improve guides and examples
3. **Testing**: Report bugs and edge cases
4. **Design**: UI/UX improvements
5. **Marketing**: Spread the word

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: https://oracletoken.io (coming soon)
- **Twitter**: @OracleToken
- **Discord**: discord.gg/oracletoken
- **Documentation**: docs.oracletoken.io
- **GitHub**: github.com/oracletoken

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. Prediction markets may be subject to regulations in your jurisdiction. Always consult with legal and financial advisors before participating.

## 🙏 Acknowledgments

Built with:
- [Solana](https://solana.com) - High-performance blockchain
- [Anchor](https://www.anchor-lang.com) - Solana development framework
- [SPL Token](https://spl.solana.com) - Token standard

Inspired by:
- Polymarket, Augur, Gnosis - Prediction market pioneers
- Proof of Humanity - Reputation systems
- The wisdom of crowds

---

**Built with ❤️ on Solana**

For questions or support: hello@oracletoken.io
