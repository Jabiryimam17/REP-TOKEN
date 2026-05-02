'use client';

import {JsonRpcProvider} from "ethers";
import dotenv from "dotenv";
dotenv.config({path:"../../.env"});
export default async () => {
    const sepolia_rpc_url = process.env.SEPOLIA_RPC_URL;

    return new JsonRpcProvider(sepolia_rpc_url);
}

