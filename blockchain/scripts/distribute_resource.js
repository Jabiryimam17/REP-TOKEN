import { ethers, JsonRpcProvider, HDNodeWallet } from "ethers";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

// --- 1️⃣ Provider & root signer ---
const sepolia_rpc_url = process.env.SEPOLIA_RPC_URL;
console.log(`Using provider: ${sepolia_rpc_url}`);
const provider = new JsonRpcProvider(sepolia_rpc_url);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY_REGISTRANT, provider);

// --- 2️⃣ Sepolia LINK token ---
const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // Sepolia LINK token
const LINK_ABI = [
    "function transfer(address to, uint256 amount) public returns (bool)"
];

// --- 3️⃣ Create LINK contract instance ---
const link_contract = new ethers.Contract(LINK_ADDRESS, LINK_ABI, signer);

// --- 4️⃣ Your mnemonic-derived wallets ---
const mnemonic = process.env.MNEMONIC;

for (let i = 1; i < 10; i++) {
    const derivationPath = `m/44'/60'/0'/0/${i}`;
    const wallet = HDNodeWallet.fromPhrase(mnemonic, "", derivationPath).connect(provider);

    // 4a️⃣ Send ETH first
    const ethAmount = ethers.parseEther("0.1");
    const txEth = await signer.sendTransaction({ to: wallet.address, value: ethAmount });
    await txEth.wait();
    console.log(`Sent 0.1 ETH to ${wallet.address}`);

    // 4b️⃣ Send LINK
    const linkAmount = ethers.parseUnits("20", 18); // 10 LINK tokens
    const txLink = await link_contract.transfer(wallet.address, linkAmount);
    await txLink.wait();
    console.log(`Sent 20 LINK to ${wallet.address}`);
}