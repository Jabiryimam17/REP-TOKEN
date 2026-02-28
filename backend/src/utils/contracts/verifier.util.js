import verifier from "#abis/VerifierSystem.json" with {type:"json"};
const verifier_abi = verifier.abi;

import {ethers} from "ethers";
import connect_wallet from "#utils/connect_wallet.util.js";
import addresses from "#utils/system_addresses.util.js";
const {verifier_address} = addresses;
export default async ()=>{
        const provider=await connect_wallet();
        return new ethers.Contract(verifier_address, verifier_abi, provider);
}
