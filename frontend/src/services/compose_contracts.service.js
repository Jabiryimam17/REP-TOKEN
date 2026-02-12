import {abi as rpt_access_manager_abi} from "../abis/RPTAccessManager.json" with {type: "json"}

import {abi as job_system_abi} from "../abis/JobPayingSystem.json" with {type: "json"}
import {abi as registry_abi} from "../abis/Registry.json" with {type: "json"}
import {abi as rpt_abi} from "../abis/ReputationToken.json" with {type: "json"}
import {abi as reward_vault_abi} from "../abis/RewardVault.json" with {type: "json"}
import {abi as treasury_abi} from "../abis/Treasury.json" with {type: "json"}
import {abi as verifier_abi} from "../abis/VerifierSystem.json" with {type: "json"}
import {abi as factory_abi} from "../abis/UniswapV2Factory.json" with {type: "json"}
import {abi as router_abi} from "../abis/UniswapV2Router02.json" with {type: "json"}

import connect_wallet from "./connect_wallet.service.js"
import addresses from "./system_addresses.service.js"
import {ethers} from "ethers";
async function main () {
        const {provider} = await connect_wallet();
    const rpt_access_manage_contract = new ethers.Contract(addresses.access_manager_address, rpt_access_manager_abi, provider);

    const rpt_contract=new ethers.Contract(addresses.rpt_address, rpt_abi, provider);

    const treasury_contract = new ethers.Contract(addresses.treasury_address, treasury_abi, provider);
    const reward_vault_contract = new ethers.Contract(addresses.reward_vault_address, reward_vault_abi, provider);
    const job_manager_contract = new ethers.Contract(addresses.job_manager_address, job_system_abi, provider);
    const verifier_contract = new ethers.Contract(addresses.verifier_address, verifier_abi, provider);
    const registry_contract = new ethers.Contract(addresses.registry_address, registry_abi, provider);
    const router_contract = new ethers.Contract(addresses.router_address, router_abi, provider);
    return {rpt_access_manage_contract,rpt_contract,treasury_contract,reward_vault_contract,job_manager_contract,verifier_contract, registry_contract, router_contract};
}
export default await main();