import { HDNodeWallet, JsonRpcProvider } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({path: path.resolve(process.cwd(), "../.env")});

// Setup provider (Sepolia)
const provider = new JsonRpcProvider(process.env.SEPOLIA_URL);

const mnemonic =HDNodeWallet.createRandom().mnemonic.phrase;

console.log(mnemonic);
// Save mnemonic to .env
fs.appendFileSync(path.resolve(process.cwd(), "../.env"), `MNEMONIC=${mnemonic}\n`);

// Names for accounts
const account_names = [
        "registrant", "token_manager", "treasury_manager", "job_manager",
        "verifier_manager", "reward_vault_manager",
        "employer_f", "employer_s", "freelancer_f", "freelancer_s"
];

// Derive first 10 accounts and save their private keys
for (let i = 0; i < 10; i++) {
        const derivation_path = `m/44'/60'/0'/0/${i}`;

        // Create the wallet instance directly for each index
        const wallet = HDNodeWallet.fromPhrase(mnemonic, "", derivation_path).connect(provider);

        fs.appendFileSync(path.resolve(process.cwd(), "../.env"), `PRIVATE_KEY_${account_names[i].toUpperCase()}=${wallet.privateKey}\n`);
        console.log(`Account ${account_names[i]}: ${wallet.address}`);
}
//0x044d486dDA6629FE7A5dAE7b9Ee627741D9A0C52