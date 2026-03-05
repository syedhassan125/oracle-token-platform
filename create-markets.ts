import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj");
const ORACLE_TOKEN_MINT = new PublicKey("6SnhG4g4icbJ2i9U97zEtxkSc6dZ5Z8sCSTtSJH2QuqA");
const MARKETS = [
  { id: 3, title: "Will Bitcoin hit $150k in 2025?", category: { crypto: {} } },
  { id: 4, title: "Will Solana flip Ethereum by market cap?", category: { crypto: {} } },
  { id: 5, title: "Will the Fed cut rates 3+ times in 2025?", category: { economics: {} } },
];

async function main() {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);
  const idl = JSON.parse(fs.readFileSync("./target/idl/oracle_token.json", "utf8"));
  const program = new Program(idl, provider);
  const [platformState] = PublicKey.findProgramAddressSync([Buffer.from("platform")], PROGRAM_ID);
  const [creatorProfile] = PublicKey.findProgramAddressSync([Buffer.from("profile"), provider.wallet.publicKey.toBuffer()], PROGRAM_ID);
  const resolutionTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);
  for (const m of MARKETS) {
    const marketId = new anchor.BN(m.id);
    const [marketPDA] = PublicKey.findProgramAddressSync([Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 6)], PROGRAM_ID);
    try {
      await (program.methods as any).createMarket(marketId, m.title, m.title, m.category, resolutionTimestamp, ["Yes", "No"]).accounts({ market: marketPDA, creatorProfile, platformState, creator: provider.wallet.publicKey, systemProgram: SystemProgram.programId }).rpc();
      console.log("Market " + m.id + " created: " + marketPDA.toString());
      const marketVault = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, marketPDA, true);
      const ix = createAssociatedTokenAccountInstruction(provider.wallet.publicKey, marketVault, marketPDA, ORACLE_TOKEN_MINT, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
      await provider.sendAndConfirm(new Transaction().add(ix));
      console.log("Vault " + m.id + " created");
    } catch(e: any) { console.error("Market " + m.id + " error:", e.message); }
  }
}
main().catch(console.error);
