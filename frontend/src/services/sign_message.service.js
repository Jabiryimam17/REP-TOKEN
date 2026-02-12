import connect_wallet from "./connect_wallet.service"
import {ethers} from "ethers";

export default async (message)=>{
    const {signer} = await connect_wallet();
    const signature = await signer.signMessage(message);
    const hash= await ethers.keccak256(await signer.getAddress());
    return {signature,hash};
}