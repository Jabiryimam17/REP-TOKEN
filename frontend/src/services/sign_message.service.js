import connect_wallet from "./connect_wallet.service"
import {ethers, getAddress, getBytes} from "ethers";

export default async (message)=>{
    const {signer} = await connect_wallet();
    const signature = await signer.signMessage(message);
    const norm_address = getAddress(await signer.getAddress());
    const hash= await ethers.keccak256(getBytes(norm_address));
    return {signature,hash};
}