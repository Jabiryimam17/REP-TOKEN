'use client';

import {JsonRpcProvider} from "ethers";

export default async () => {

    const provider = new JsonRpcProvider("http://localhost:8545");
    const signer = await provider.getSigner();
    return {provider, signer};


}

