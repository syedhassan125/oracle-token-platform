import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj");
const ORACLE_TOKEN_MINT = new PublicKey("6SnhG4g4icbJ2i9U97zEtxkSc6dZ5Z8sCSTtSJH2QuqA");
const MARKET_PDA = new PublicKey("5ZHfybcV5sSf7uZ6PemM2pychytL6wbXmdnwaiWbbMPp");

async function main() {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  const idl = JSON.parse(fs.readFileSync("./target/idl/oracle_token.json", "utf8"));
  const program = new Program(idl, provider);

  const [predictionPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("prediction"), provider.wallet.publicKey.toBuffer(), MARKET_PDA.toBuffer()],
    PROGRAM_ID
  );

  const [userProfile] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), provider.wallet.publicKey.toBuffer()],
    PROGRAM_ID
  );

  const userTokenAccount = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, provider.wallet.publicKey);

  // Market vault is a token account owned by the market PDA
  const marketVault = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, MARKET_PDA, true);

  console.log("Prediction PDA:", predictionPDA.toString());
  console.log("User Profile:", userProfile.toString());
  console.log("User Token Account:", userTokenAccount.toString());
  console.log("Market Vault:", marketVault.toString());

  try {
    const tx = await (program.methods as any).makePrediction(
      0, // option_index: 0 = Yes
      new anchor.BN(100) // amount: 100 tokens
    )
    .accounts({
      prediction: predictionPDA,
      market: MARKET_PDA,
      userProfile,
      user: provider.wallet.publicKey,
      userTokenAccount,
      marketVault,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

    console.log("✅ Bet placed! TX:", tx);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

main().catch(console.error);
