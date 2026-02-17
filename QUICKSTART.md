# 🚀 Quick Start Guide - Oracle Token

This guide will help you set up and deploy the Oracle Token prediction market in under 30 minutes.

## Prerequisites Checklist

Before starting, make sure you have:

- [ ] **Rust** installed (latest stable version)
- [ ] **Solana CLI** installed (v1.17.0+)
- [ ] **Anchor** framework installed (v0.29.0+)
- [ ] **Node.js** and **npm** installed (v18+)
- [ ] A **Solana wallet** with some SOL
- [ ] Basic knowledge of Rust and TypeScript

## Step 1: Install Dependencies (10 minutes)

### Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup component add rustfmt
```

### Install Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
export PATH="/home/$USER/.local/share/solana/install/active_release/bin:$PATH"
```

### Install Anchor
```bash
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

Verify installations:
```bash
rustc --version
solana --version
anchor --version
```

## Step 2: Configure Solana (5 minutes)

### Generate a Wallet
```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

### Set Cluster to Devnet
```bash
solana config set --url https://api.devnet.solana.com
```

### Get Devnet SOL (Free Testnet Tokens)
```bash
solana airdrop 2
solana balance  # Should show ~2 SOL
```

For more SOL, use the [Solana Faucet](https://faucet.solana.com/).

## Step 3: Build the Program (5 minutes)

```bash
cd oracle-token-solana

# Install Node dependencies
npm install

# Build the Solana program
anchor build

# This generates:
# - target/deploy/oracle_token.so (the compiled program)
# - target/idl/oracle_token.json (the interface definition)
```

## Step 4: Deploy to Devnet (5 minutes)

### Make deploy script executable
```bash
chmod +x deploy.sh
```

### Deploy the program
```bash
./deploy.sh
```

**Important:** Save the Program ID that's displayed! You'll need it.

Example output:
```
Program ID: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

### Update Configuration
Edit `Anchor.toml` and replace the program ID:
```toml
[programs.devnet]
oracle_token = "YOUR_PROGRAM_ID_HERE"
```

## Step 5: Initialize Platform (3 minutes)

### Create Oracle Token Mint (SPL Token)
```bash
spl-token create-token --decimals 6
# Save the Token Mint Address
```

### Initialize the Platform
```typescript
// Use the TypeScript client
import { OracleTokenClient } from './client';

const client = new OracleTokenClient(program, provider);
const { platformState } = await client.initialize(
  oracleTokenMint,  // Your token mint address
  200  // 2% platform fee
);
```

Or use the CLI:
```bash
anchor run initialize -- --mint YOUR_TOKEN_MINT_ADDRESS
```

## Step 6: Test the System (2 minutes)

```bash
# Run the test suite
anchor test

# You should see:
# ✅ Platform initialized
# ✅ User profiles created
# ✅ Market creation flow
# ✅ Prediction mechanics
# ✅ Resolution & rewards
```

## Step 7: Create Your First Market

### Create a User Profile First
```typescript
await client.createUserProfile();
```

### Create a Market (Need 1000+ Oracle Tokens)

For testing, you can manually mint tokens to yourself:
```bash
spl-token mint YOUR_TOKEN_MINT 10000 YOUR_TOKEN_ACCOUNT
```

Then create a market:
```typescript
await client.createMarket(
  1,  // Market ID
  "Will Bitcoin reach $100k in 2024?",
  "Resolves YES if BTC hits $100,000 at any time in 2024",
  MarketCategory.Crypto,
  Math.floor(Date.now() / 1000) + 86400 * 365,  // 1 year
  ["Yes", "No"]
);
```

## Step 8: Make Your First Prediction

```typescript
await client.makePrediction(
  1,  // Market ID
  0,  // Option 0 (Yes)
  1_000_000,  // 1 token (6 decimals)
  oracleTokenMint
);
```

## Troubleshooting

### "Insufficient funds" Error
```bash
# Get more devnet SOL
solana airdrop 2
```

### "Program failed to deploy"
```bash
# Check your SOL balance
solana balance

# Increase priority fee
solana program deploy --upgrade-authority ~/.config/solana/id.json \
  --with-compute-unit-price 100000 \
  target/deploy/oracle_token.so
```

### "Account not found"
```bash
# Make sure you initialized the platform
anchor run initialize

# Check if accounts exist
solana account YOUR_ACCOUNT_ADDRESS
```

### Build Errors
```bash
# Clean and rebuild
anchor clean
anchor build

# Update dependencies
cargo update
```

## Next Steps

### For Developers
1. Read the [full README](README.md) for architecture details
2. Explore the [TypeScript client](client.ts) SDK
3. Review the [smart contract](lib.rs) code
4. Check out the [frontend example](frontend-example.tsx)

### For Users
1. Create your user profile
2. Explore active markets
3. Make predictions and earn Oracle Tokens
4. Progress through the tiers (Basic → Expert → Oracle)

### For Product Teams
1. Deploy to mainnet (use mainnet-beta cluster)
2. Set up monitoring and alerts
3. Create a web frontend
4. Market your platform
5. Build a community

## Production Deployment

When ready for mainnet:

1. **Switch to Mainnet**
```bash
solana config set --url https://api.mainnet-beta.solana.com
```

2. **Fund Your Wallet**
```bash
# Buy real SOL from an exchange
# Send to your wallet address
solana address
```

3. **Deploy**
```bash
./deploy.sh
# Costs approximately 5-10 SOL
```

4. **Security Audit**
- Get professional security audit
- Run bug bounty program
- Implement gradual rollout

5. **Launch!**
- Announce on Twitter/Discord
- List on DeFi aggregators
- Engage community

## Cost Estimates

### Development (Devnet)
- **Free** - Devnet SOL is free

### Production (Mainnet)
- **Deployment**: 5-10 SOL (~$500-1000)
- **Rent**: ~0.01 SOL per account
- **Transactions**: ~0.000005 SOL per tx

### Ongoing Costs
- **RPC Node**: $0-200/month (use free tier initially)
- **Hosting**: $20-50/month (frontend)
- **Monitoring**: $0-50/month

## Support

Need help? Reach out:
- **Discord**: discord.gg/oracletoken
- **Twitter**: @OracleToken
- **Email**: support@oracletoken.io
- **GitHub Issues**: github.com/oracletoken/issues

## Resources

- [Solana Docs](https://docs.solana.com)
- [Anchor Book](https://book.anchor-lang.com)
- [SPL Token Guide](https://spl.solana.com/token)
- [Solana Cookbook](https://solanacookbook.com)

---

**Ready to build the future of prediction markets? Let's go! 🚀**
