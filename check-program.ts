import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj");

async function main() {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  // Check platform state PDA
  const [platformState] = PublicKey.findProgramAddressSync(
    [Buffer.from("platform")],
    PROGRAM_ID
  );
  console.log("Platform State PDA:", platformState.toString());

  const info = await provider.connection.getAccountInfo(platformState);
  console.log("Platform State exists:", info !== null);
  if (info) console.log("Platform State data length:", info.data.length);
}

main().catch(console.error);
