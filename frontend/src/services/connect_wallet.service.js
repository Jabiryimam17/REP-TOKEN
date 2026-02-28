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
        return { provider:cached_provider, signer: cached_signer };
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });

    cached_provider = new BrowserProvider(window.ethereum);
    cached_signer = await cached_provider.getSigner();

    return { provider:cached_provider, signer: cached_signer };
}

