import {abi as rpt_access_manager_abi} from "../abis/RPTAccessManager.json" with {type: "json"}

import {abi as job_system_abi} from "../abis/JobPayingSystem.json" with {type: "json"}
import {abi as registry_abi} from "../abis/Registry.json" with {type: "json"}
import {abi as rpt_abi} from "../abis/ReputationToken.json" with {type: "json"}
import {abi as reward_vault_abi} from "../abis/RewardVault.json" with {type: "json"}
import {abi as treasury_abi} from "../abis/Treasury.json" with {type: "json"}
import {abi as verifier_abi} from "../abis/VerifierSystem.json" with {type: "json"}
import {abi as factory_abi} from "../abis/UniswapV2Factory.json" with {type: "json"}
import {abi as router_abi} from "../abis/UniswapV2Router02.json" with {type: "json"}
import {abi as eth_abi} from "../abis/EthioCoin.json" with {type: "json"}
import connect_wallet from "./connect_wallet.service.js"
import {get_addresses} from "./system_addresses.service.js"
import {ethers} from "ethers";

// Static metadata that never changes on-chain for our known tokens
export const TOKEN_METADATA = {
    rpt: { symbol: "RPT", decimals: 18, name: "Reputation Token" },
    ethio: { symbol: "ETC", decimals: 18, name: "EthioCoin" },
    weth: { symbol: "WETH", decimals: 18, name: "Wrapped Ether" }
};

let cached_contracts = null;
let last_signer = null;

export async function get_contracts () {
    const { signer } = await connect_wallet();
    
    // If signer hasn't changed and we have cached contracts, return them
    if (cached_contracts && last_signer === signer) {
        return cached_contracts;
    }

    const addresses=await get_addresses();

    const rpt_access_manage_contract = new ethers.Contract(addresses.access_manager_address, rpt_access_manager_abi, signer);
    const rpt_contract=new ethers.Contract(addresses.rpt_address, rpt_abi, signer);
    const eth_contract = new ethers.Contract(addresses.ethiocoin_address, eth_abi, signer);
    const treasury_contract = new ethers.Contract(addresses.treasury_address, treasury_abi, signer);
    const reward_vault_contract = new ethers.Contract(addresses.reward_vault_address, reward_vault_abi, signer);
    const job_manager_contract = new ethers.Contract(addresses.job_manager_address, job_system_abi, signer);
    const verifier_contract = new ethers.Contract(addresses.verifier_address, verifier_abi, signer);
    const registry_contract = new ethers.Contract(addresses.registry_address, registry_abi, signer);
    const router_contract = new ethers.Contract(addresses.router_address, router_abi, signer);
    
    cached_contracts = {
        rpt_access_manage_contract,
        rpt_contract,
        treasury_contract,
        reward_vault_contract,
        job_manager_contract,
        verifier_contract, 
        registry_contract, 
        router_contract, 
        eth_contract
    };
    last_signer = signer;

    return cached_contracts;
}
