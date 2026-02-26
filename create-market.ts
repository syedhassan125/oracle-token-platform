import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj");

async function main() {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  const idl = JSON.parse(fs.readFileSync("./target/idl/oracle_token.json", "utf8"));
  const program = new Program(idl, provider);

  const marketId = new anchor.BN(1);

  const [marketPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 6)],
    PROGRAM_ID
  );

  const [platformState] = PublicKey.findProgramAddressSync(
    [Buffer.from("platform")],
    PROGRAM_ID
  );

  const [creatorProfile] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), provider.wallet.publicKey.toBuffer()],
    PROGRAM_ID
  );

  console.log("Market PDA:", marketPDA.toString());
  console.log("Platform State:", platformState.toString());
  console.log("Creator Profile:", creatorProfile.toString());

  // Check if creator profile exists
  const profileInfo = await provider.connection.getAccountInfo(creatorProfile);
  if (!profileInfo) {
    console.log("Creating user profile first...");
    await (program.methods as any).createUserProfile()
      .accounts({
        userProfile: creatorProfile,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("User profile created!");
  }

  const resolutionTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);

  try {
    const tx = await (program.methods as any).createMarket(
      marketId,
      "Will BTC reach $100k by end of 2025?",
      "Market for predicting whether Bitcoin will reach $100,000 USD",
      { crypto: {} },
      resolutionTimestamp,
      ["Yes", "No"]
    )
    .accounts({
      market: marketPDA,
      creatorProfile,
      platformState,
      creator: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

    console.log("✅ Market created! TX:", tx);
    console.log("Market address:", marketPDA.toString());
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

main().catch(console.error);
