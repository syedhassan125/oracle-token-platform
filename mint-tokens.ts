import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj");
const ORACLE_TOKEN_MINT = new PublicKey("6SnhG4g4icbJ2i9U97zEtxkSc6dZ5Z8sCSTtSJH2QuqA");

async function main() {
  // Set up provider
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  console.log("Connected to:", provider.connection.rpcEndpoint);
  console.log("Wallet:", provider.wallet.publicKey.toString());

  // Load the mint authority keypair
  const secretKey = JSON.parse(
    fs.readFileSync("/Users/syedhassan/.config/solana/id.json", "utf-8")
  );
  const mintAuthority = Keypair.fromSecretKey(Uint8Array.from(secretKey));

  console.log("\nMint Authority:", mintAuthority.publicKey.toString());
  console.log("Oracle Token Mint:", ORACLE_TOKEN_MINT.toString());

  // Get or create associated token account for your wallet
  console.log("\nGetting/creating token account...");
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    mintAuthority,
    ORACLE_TOKEN_MINT,
    provider.wallet.publicKey
  );

  console.log("Token Account:", tokenAccount.address.toString());

  // Mint 10,000 tokens to your wallet
  const amount = 10_000;
  console.log(`\nMinting ${amount.toLocaleString()} Oracle Tokens...`);

  const signature = await mintTo(
    provider.connection,
    mintAuthority,
    ORACLE_TOKEN_MINT,
    tokenAccount.address,
    mintAuthority,
    amount * 1_000_000 // 6 decimals
  );

  console.log("✅ Minted successfully!");
  console.log("Transaction signature:", signature);
  console.log(`\nYour new balance: ${amount.toLocaleString()} Oracle Tokens 🔮`);
  console.log("\nRefresh your browser to see the updated balance!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
