import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj");

async function main() {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  const accounts = await provider.connection.getProgramAccounts(PROGRAM_ID);
  console.log("Total program accounts:", accounts.length);
  accounts.forEach((acc, i) => {
    console.log(`Account ${i}: ${acc.pubkey.toString()} - ${acc.account.data.length} bytes`);
  });
}

main().catch(console.error);
