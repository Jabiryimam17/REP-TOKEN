import {job_manager_address} from "../../services/system_addresses.service.js";
import {abi as job_manager_abi} from "../../abis/JobPayingSystem.json" with {type: "json"};
import connect_wallet from "#services/connect_wallet.service.js";
import ethers from "ethers";
export default new ethers.Contract(job_manager_address, job_manager_abi, connect_wallet().signer);