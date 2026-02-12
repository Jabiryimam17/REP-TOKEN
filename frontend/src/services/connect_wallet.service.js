'use client';

import {ethers, JsonRpcProvider} from "ethers";

export default async ()=> {
    if (typeof window === "undefined") {
        const provider=new JsonRpcProvider("http://localhost:8545");
        const signer= await provider.getSigner();
        return {provider,signer};
    }


    if (!window.ethereum) {
        throw new Error("MetaMask not installed");
    }



    await window.ethereum.request({ method: "eth_requestAccounts" });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    return { provider, signer };
}

