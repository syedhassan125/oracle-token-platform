import React, { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { OracleTokenClient, MarketCategory, createOracleTokenClient } from './client';

// Example React component for Oracle Token frontend
export const PredictionMarketApp: React.FC = () => {
  const wallet = useWallet();
  const [client, setClient] = useState<OracleTokenClient | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeMarkets, setActiveMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const programId = new PublicKey('YOUR_PROGRAM_ID'); // Replace with actual program ID

  // Initialize client when wallet connects
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      initializeClient();
    }
  }, [wallet.connected, wallet.publicKey]);

  const initializeClient = async () => {
    try {
      const oracleClient = await createOracleTokenClient(
        connection,
        wallet as any,
        programId
      );
      setClient(oracleClient);
      
      // Load user profile
      const profile = await oracleClient.getUserProfile(wallet.publicKey!);
      setUserProfile(profile);
      
      // Load active markets
      const markets = await oracleClient.getActiveMarkets();
      setActiveMarkets(markets);
    } catch (error) {
      console.error('Error initializing client:', error);
    }
  };

  const createUserProfile = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      await client.createUserProfile();
      alert('Profile created successfully!');
      await initializeClient(); // Refresh
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Failed to create profile');
    }
    setLoading(false);
  };

  const createMarket = async (
    title: string,
    description: string,
    category: MarketCategory,
    daysUntilResolution: number,
    options: string[]
  ) => {
    if (!client) return;
    
    setLoading(true);
    try {
      const marketId = Math.floor(Math.random() * 1000000);
      const resolutionTimestamp = Math.floor(Date.now() / 1000) + (daysUntilResolution * 86400);
      
      await client.createMarket(
        marketId,
        title,
        description,
        category,
        resolutionTimestamp,
        options
      );
      
      alert('Market created successfully!');
      await initializeClient(); // Refresh markets
    } catch (error) {
      console.error('Error creating market:', error);
      alert('Failed to create market. Need 1000+ Oracle Tokens.');
    }
    setLoading(false);
  };

  const makePrediction = async (
    marketId: number,
    optionIndex: number,
    amount: number,
    tokenMint: PublicKey
  ) => {
    if (!client) return;
    
    setLoading(true);
    try {
      await client.makePrediction(marketId, optionIndex, amount, tokenMint);
      alert('Prediction made successfully!');
    } catch (error) {
      console.error('Error making prediction:', error);
      alert('Failed to make prediction');
    }
    setLoading(false);
  };

  // Calculate user's tier based on tokens
  const getUserTier = (tokens: number): { tier: string; color: string; benefits: string[] } => {
    if (tokens >= 10000) {
      return {
        tier: 'Oracle',
        color: 'text-purple-600',
        benefits: [
          'Resolve markets',
          'Earn staking fees',
          'Quality control',
          'Governance voting'
        ]
      };
    } else if (tokens >= 1000) {
      return {
        tier: 'Expert',
        color: 'text-blue-600',
        benefits: [
          'Create markets',
          'Earn market fees',
          'Higher voting power',
          'Expert-only markets'
        ]
      };
    } else if (tokens >= 100) {
      return {
        tier: 'Basic',
        color: 'text-green-600',
        benefits: [
          'Vote on disputes',
          'Advanced analytics',
          'Reduced fees (0.5%)',
          'Profile statistics'
        ]
      };
    } else {
      return {
        tier: 'Novice',
        color: 'text-gray-600',
        benefits: [
          'Make predictions',
          'Earn Oracle Tokens',
          'Track accuracy',
          'Basic features'
        ]
      };
    }
  };

  if (!wallet.connected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">🔮 Oracle Token</h1>
          <p className="text-xl mb-8">Connect your wallet to get started</p>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Create Your Profile</h2>
          <p className="mb-6 text-gray-600">
            Start your journey to becoming an Oracle!
          </p>
          <button
            onClick={createUserProfile}
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Profile'}
          </button>
        </div>
      </div>
    );
  }

  const tier = getUserTier(userProfile.totalTokens.toNumber());
  const accuracy = userProfile.totalPredictions.toNumber() > 0
    ? (userProfile.correctPredictions.toNumber() / userProfile.totalPredictions.toNumber() * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">🔮 Oracle Token</h1>
          <div className="text-right">
            <div className={`text-sm font-semibold ${tier.color}`}>{tier.tier} Tier</div>
            <div className="text-xs text-gray-600">
              {wallet.publicKey?.toBase58().slice(0, 4)}...{wallet.publicKey?.toBase58().slice(-4)}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Oracle Tokens</div>
            <div className="text-3xl font-bold text-purple-600">
              {userProfile.totalTokens.toNumber().toLocaleString()}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Accuracy</div>
            <div className="text-3xl font-bold text-green-600">{accuracy}%</div>
            <div className="text-xs text-gray-500">
              {userProfile.correctPredictions.toNumber()} / {userProfile.totalPredictions.toNumber()} correct
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Volume</div>
            <div className="text-3xl font-bold text-blue-600">
              {(userProfile.totalVolume.toNumber() / 1_000_000).toFixed(2)}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Markets Created</div>
            <div className="text-3xl font-bold text-orange-600">
              {userProfile.marketsCreated.toNumber()}
            </div>
          </div>
        </div>

        {/* Tier Benefits */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Your Benefits ({tier.tier} Tier)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tier.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
          
          {tier.tier !== 'Oracle' && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Progress to next tier:
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-purple-600 h-2.5 rounded-full"
                  style={{
                    width: `${Math.min(
                      (userProfile.totalTokens.toNumber() / 
                        (tier.tier === 'Novice' ? 100 : tier.tier === 'Basic' ? 1000 : 10000)) * 100,
                      100
                    )}%`
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Active Markets */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Active Markets</h2>
          
          {activeMarkets.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No active markets. Create one to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {activeMarkets.map((market, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition">
                  <h3 className="font-semibold text-lg mb-2">{market.account.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{market.account.description}</p>
                  
                  <div className="flex gap-2 mb-3">
                    {market.account.options.map((option: string, optIdx: number) => (
                      <button
                        key={optIdx}
                        className="flex-1 bg-gray-100 hover:bg-purple-100 py-2 px-4 rounded"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Total Volume: {(market.account.totalVolume.toNumber() / 1_000_000).toFixed(2)} tokens
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PredictionMarketApp;
