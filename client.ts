import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";

export class OracleTokenClient {
  program: Program;
  provider: anchor.AnchorProvider;

  constructor(program: Program, provider: anchor.AnchorProvider) {
    this.program = program;
    this.provider = provider;
  }

  /**
   * Initialize the Oracle Token platform
   */
  async initialize(
    oracleTokenMint: PublicKey,
    platformFeeBps: number = 200 // 2% default
  ) {
    const [platformState] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform")],
      this.program.programId
    );

    const tx = await this.program.methods
      .initialize(platformFeeBps)
      .accounts({
        platformState,
        authority: this.provider.wallet.publicKey,
        oracleTokenMint,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Platform initialized:", tx);
    return { platformState, signature: tx };
  }

  /**
   * Create a user profile
   */
  async createUserProfile(user?: PublicKey) {
    const userPubkey = user || this.provider.wallet.publicKey;

    const [userProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), userPubkey.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .createUserProfile()
      .accounts({
        userProfile,
        user: userPubkey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("User profile created:", tx);
    return { userProfile, signature: tx };
  }

  /**
   * Create a prediction market
   */
  async createMarket(
    marketId: number,
    title: string,
    description: string,
    category: MarketCategory,
    resolutionTimestamp: number,
    options: string[]
  ) {
    const [market] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), new anchor.BN(marketId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );

    const [creatorProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), this.provider.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const [platformState] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform")],
      this.program.programId
    );

    const tx = await this.program.methods
      .createMarket(
        new anchor.BN(marketId),
        title,
        description,
        category,
        new anchor.BN(resolutionTimestamp),
        options
      )
      .accounts({
        market,
        creatorProfile,
        platformState,
        creator: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Market created:", tx);
    return { market, signature: tx };
  }

  /**
   * Make a prediction on a market
   */
  async makePrediction(
    marketId: number,
    optionIndex: number,
    amount: number,
    tokenMint: PublicKey
  ) {
    const [market] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), new anchor.BN(marketId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );

    const [prediction] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("prediction"),
        this.provider.wallet.publicKey.toBuffer(),
        market.toBuffer(),
      ],
      this.program.programId
    );

    const [userProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), this.provider.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const userTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      this.provider.wallet.publicKey
    );

    const marketVault = await getAssociatedTokenAddress(tokenMint, market, true);

    const tx = await this.program.methods
      .makePrediction(optionIndex, new anchor.BN(amount))
      .accounts({
        prediction,
        market,
        userProfile,
        user: this.provider.wallet.publicKey,
        userTokenAccount,
        marketVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Prediction made:", tx);
    return { prediction, signature: tx };
  }

  /**
   * Resolve a market
   */
  async resolveMarket(marketId: number, correctOptionIndex: number) {
    const [market] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), new anchor.BN(marketId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );

    const [resolverProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), this.provider.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .resolveMarket(correctOptionIndex)
      .accounts({
        market,
        resolverProfile,
        resolver: this.provider.wallet.publicKey,
      })
      .rpc();

    console.log("Market resolved:", tx);
    return { signature: tx };
  }

  /**
   * Claim reward from a resolved market
   */
  async claimReward(marketId: number, tokenMint: PublicKey) {
    const [market] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), new anchor.BN(marketId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );

    const [prediction] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("prediction"),
        this.provider.wallet.publicKey.toBuffer(),
        market.toBuffer(),
      ],
      this.program.programId
    );

    const [userProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), this.provider.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const [platformState] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform")],
      this.program.programId
    );

    const userTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      this.provider.wallet.publicKey
    );

    const marketVault = await getAssociatedTokenAddress(tokenMint, market, true);

    const tx = await this.program.methods
      .claimReward()
      .accounts({
        market,
        prediction,
        userProfile,
        platformState,
        user: this.provider.wallet.publicKey,
        userTokenAccount,
        marketVault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Reward claimed:", tx);
    return { signature: tx };
  }

  /**
   * Get user profile data
   */
  async getUserProfile(user: PublicKey) {
    const [userProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), user.toBuffer()],
      this.program.programId
    );

    try {
      const profile = await this.program.account.userProfile.fetch(userProfile);
      return profile;
    } catch (error) {
      console.log("Profile not found");
      return null;
    }
  }

  /**
   * Get market data
   */
  async getMarket(marketId: number) {
    const [market] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), new anchor.BN(marketId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );

    const marketData = await this.program.account.market.fetch(market);
    return marketData;
  }

  /**
   * Get all active markets
   */
  async getActiveMarkets() {
    const markets = await this.program.account.market.all([
      {
        memcmp: {
          offset: 8 + 8 + 32 + 200 + 500 + 1 + 400 + 400 + 8, // offset to status field
          bytes: anchor.utils.bytes.bs58.encode(Buffer.from([0])), // MarketStatus::Active = 0
        },
      },
    ]);
    return markets;
  }

  /**
   * Get user's prediction for a market
   */
  async getUserPrediction(marketId: number, user: PublicKey) {
    const [market] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), new anchor.BN(marketId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );

    const [prediction] = PublicKey.findProgramAddressSync(
      [Buffer.from("prediction"), user.toBuffer(), market.toBuffer()],
      this.program.programId
    );

    try {
      const predictionData = await this.program.account.prediction.fetch(prediction);
      return predictionData;
    } catch (error) {
      console.log("Prediction not found");
      return null;
    }
  }

  /**
   * Get platform statistics
   */
  async getPlatformState() {
    const [platformState] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform")],
      this.program.programId
    );

    const state = await this.program.account.platformState.fetch(platformState);
    return state;
  }
}

// Enums matching the Rust contract
export enum MarketCategory {
  Sports = 0,
  Politics = 1,
  Crypto = 2,
  Entertainment = 3,
  Technology = 4,
  Economics = 5,
  Science = 6,
  Other = 7,
}

export enum MarketStatus {
  Active = 0,
  PendingResolution = 1,
  Resolved = 2,
  Disputed = 3,
  Cancelled = 4,
}

// Helper function to create a new OracleTokenClient instance
export async function createOracleTokenClient(
  connection: anchor.web3.Connection,
  wallet: anchor.Wallet,
  programId: PublicKey
): Promise<OracleTokenClient> {
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );

  const idl = await anchor.Program.fetchIdl(programId, provider);
  if (!idl) {
    throw new Error("IDL not found");
  }

  const program = new anchor.Program(idl, programId, provider);
  return new OracleTokenClient(program, provider);
}
