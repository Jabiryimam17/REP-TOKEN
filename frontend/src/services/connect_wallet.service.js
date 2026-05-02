'use client';

import {ethers, JsonRpcProvider, BrowserProvider} from "ethers";

let cached_provider = null;
let cached_signer = null;

export default async ()=> {

    


    if (typeof window === "undefined") {
        const sepolia_rpc_url="https://sepolia.infura.io/v3/bb6d222353d648378426eb2d14674257";
            const provider = new JsonRpcProvider(sepolia_rpc_url);
        const signer=provider;
        return {provider,signer};
    }


    if (!window.ethereum) {
        throw new Error("MetaMask not installed");
    }

    if (cached_signer && cached_provider) {
        // Double check if account matches cached signer
        const signerAddress = await cached_signer.getAddress();
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0 && accounts[0].toLowerCase() === signerAddress.toLowerCase()) {
            return { provider:cached_provider, signer: cached_signer };
        }
        // If not matching, reset cache to fetch new signer
        cached_signer = null;
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });

    cached_provider = new BrowserProvider(window.ethereum);
    cached_signer = await cached_provider.getSigner();

    return { provider:cached_provider, signer: cached_signer };
}

