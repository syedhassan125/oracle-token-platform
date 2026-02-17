#!/bin/bash

echo "🚀 Oracle Token Deployment Script"
echo "=================================="

# Check if Anchor is installed
if ! command -v anchor &> /dev/null
then
    echo "❌ Anchor CLI not found. Please install it first:"
    echo "   npm install -g @coral-xyz/anchor-cli"
    exit 1
fi

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null
then
    echo "❌ Solana CLI not found. Please install it first:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/v1.17.0/install)\""
    exit 1
fi

echo ""
echo "📋 Current Configuration:"
echo "   Cluster: $(solana config get | grep 'RPC URL' | awk '{print $3}')"
echo "   Wallet: $(solana config get | grep 'Keypair Path' | awk '{print $3}')"
echo ""

read -p "Do you want to continue with this configuration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Please configure your Solana CLI first:"
    echo "   solana config set --url <CLUSTER_URL>"
    echo "   solana config set --keypair <PATH_TO_KEYPAIR>"
    exit 1
fi

echo ""
echo "🔨 Building the program..."
anchor build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Get the program ID from the built program
PROGRAM_ID=$(solana address -k target/deploy/oracle_token-keypair.json)
echo "📝 Program ID: $PROGRAM_ID"

echo ""
read -p "Do you want to deploy to the configured cluster? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Deploying program..."
anchor deploy

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📝 Important Information:"
echo "   Program ID: $PROGRAM_ID"
echo "   Update your Anchor.toml with this Program ID"
echo ""
echo "🎉 Next steps:"
echo "   1. Create a token mint for Oracle Tokens (SPL Token)"
echo "   2. Initialize the platform with: anchor run initialize"
echo "   3. Test the program with: anchor test"
echo ""
echo "💡 Useful commands:"
echo "   • Check program: solana program show $PROGRAM_ID"
echo "   • Check balance: solana balance"
echo "   • View logs: solana logs $PROGRAM_ID"
