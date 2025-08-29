import { Keypair, PublicKey } from "@solana/web3.js";

import { METEORA_DBC_PROGRAM_ID } from "./src/utils/connection";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
const payerPrivateKey = '4TaYKzrGkWhQVeEeohqDwcjK4xL1YJ9hqqghXwcZ9FBBgiYqtKGKx9zjc2pVjginCKRagJqnyUY5FbdbHdJxdUG1';
const payer = Keypair.fromSecretKey(bs58.decode(payerPrivateKey));

const creatingConfigPda = async () => {
    const [configPda] = await PublicKey.findProgramAddress(
        [
            Buffer.from("config"),
            payer.publicKey.toBuffer(),
            Buffer.from("1"),
        ],
        METEORA_DBC_PROGRAM_ID
    );
    console.log("config Pda: ", configPda.toBase58());
}

creatingConfigPda();