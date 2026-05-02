import addresses from "#utils/system_addresses.util.js";
const {job_manager_address} = addresses;
import job_manager from "#abis/JobPayingSystem.json" with {type:"json"};
const job_manager_abi = job_manager.abi;
import {ethers, JsonRpcProvider} from "ethers";
import connect_wallet from "#utils/connect_wallet.util.js";
export default async () => {
        const provider=await connect_wallet();
        return new ethers.Contract(job_manager_address, job_manager_abi, provider);
}
