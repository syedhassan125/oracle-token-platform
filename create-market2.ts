import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj");
const ORACLE_TOKEN_MINT = new PublicKey("6SnhG4g4icbJ2i9U97zEtxkSc6dZ5Z8sCSTtSJH2QuqA");

async function main() {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);
  const idl = JSON.parse(fs.readFileSync("./target/idl/oracle_token.json", "utf8"));
  const program = new Program(idl, provider);

  const marketId = new anchor.BN(2);
  const [marketPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 6)],
    PROGRAM_ID
  );
  const [platformState] = PublicKey.findProgramAddressSync([Buffer.from("platform")], PROGRAM_ID);
  const [creatorProfile] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), provider.wallet.publicKey.toBuffer()], PROGRAM_ID
  );

  const resolutionTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);

  const tx = await (program.methods as any).createMarket(
    marketId,
    "Will Solana hit $500 by end of 2025?",
    "Market for predicting whether Solana will reach $500 USD",
    { crypto: {} },
    resolutionTimestamp,
    ["Yes", "No"]
  ).accounts({
    market: marketPDA,
    creatorProfile,
    platformState,
    creator: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  }).rpc();

  console.log("✅ Market 2 created! TX:", tx);
  console.log("Market address:", marketPDA.toString());

  // Init vault
  const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = await import("@solana/spl-token");
  const { Transaction } = await import("@solana/web3.js");
  const marketVault = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, marketPDA, true);
  const ix = createAssociatedTokenAccountInstruction(provider.wallet.publicKey, marketVault, marketPDA, ORACLE_TOKEN_MINT);
  const vtx = new Transaction().add(ix);
  const vsig = await provider.sendAndConfirm(vtx);
  console.log("✅ Vault created! TX:", vsig);
  console.log("Market PDA:", marketPDA.toString());
}

main().catch(console.error);
