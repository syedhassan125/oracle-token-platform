import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Transaction } from "@solana/web3.js";

const ORACLE_TOKEN_MINT = new PublicKey("6SnhG4g4icbJ2i9U97zEtxkSc6dZ5Z8sCSTtSJH2QuqA");
const MARKET_PDA = new PublicKey("5ZHfybcV5sSf7uZ6PemM2pychytL6wbXmdnwaiWbbMPp");

async function main() {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  const marketVault = await getAssociatedTokenAddress(ORACLE_TOKEN_MINT, MARKET_PDA, true);
  console.log("Market Vault:", marketVault.toString());

  const vaultInfo = await provider.connection.getAccountInfo(marketVault);
  if (vaultInfo) {
    console.log("Vault already exists!");
    return;
  }

  const ix = createAssociatedTokenAccountInstruction(
    provider.wallet.publicKey,
    marketVault,
    MARKET_PDA,
    ORACLE_TOKEN_MINT,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const tx = new Transaction().add(ix);
  const sig = await provider.sendAndConfirm(tx);
  console.log("✅ Market vault created! TX:", sig);
}

main().catch(console.error);
