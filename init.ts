import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import * as fs from "fs";

async function main() {
  // Setup connection
  const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
  const walletKeypair = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(process.env.HOME + "/.config/solana/id.json", "utf-8")))
  );
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  // Load program
  const programId = new PublicKey("HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj");
  const idl = JSON.parse(fs.readFileSync("./target/idl/oracle_token.json", "utf-8"));
  const program = new anchor.Program(idl, provider);

  const oracleTokenMint = new PublicKey("6SnhG4g4icbJ2i9U97zEtxkSc6dZ5Z8sCSTtSJH2QuqA");
  const platformFeeBps = 200; // 2%

  console.log("🚀 Initializing Oracle Token Platform...");
  console.log("Program:", programId.toString());
  console.log("Token Mint:", oracleTokenMint.toString());
  console.log("Platform Fee:", platformFeeBps / 100, "%");

  try {
    // Derive PDA for platform state
    const [platformState] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform")],
      programId
    );

    console.log("Platform State PDA:", platformState.toString());

    // Call initialize
    const tx = await program.methods
      .initialize(platformFeeBps)
      .accounts({
        platformState: platformState,
        authority: wallet.publicKey,
        oracleTokenMint: oracleTokenMint,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Platform initialized successfully!");
    console.log("Transaction signature:", tx);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main();
