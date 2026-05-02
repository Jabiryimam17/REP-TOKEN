'use client';
import {ethers, JsonRpcProvider, Wallet} from "ethers";

export default async ()=> {
                const provider=new JsonRpcProvider("http://localhost:8545");
                const temp_wallet = Wallet.createRandom(provider);
                return temp_wallet;
}