import {ethers, JsonRpcProvider} from "ethers";
import dotenv from "dotenv";
dotenv.config({ path: "../.env"});

const sepolia_rpc_url = process.env.SEPOLIA_RPC_URL;
const provider = new JsonRpcProvider(sepolia_rpc_url);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY_REGISTRANT, provider);
export default {signer, provider};