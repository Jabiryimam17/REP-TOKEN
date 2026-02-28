import {ethers} from 'ethers'

import connect_wallet from "../services/connect_wallet.service.js";
import {abi as registry_abi} from "../abis/Registry.json" with {type: "json"}
import config from "../configs/registry_address.json" with {type: "json"}

let cached_addresses = null;

export async function get_addresses() {
    if (cached_addresses) return cached_addresses;

    const {provider,} = await connect_wallet();
    const registry_contract = new ethers.Contract(config.registry, registry_abi, provider);
    const [access_manager_address,rpt_address,ethiocoin_address, treasury_address, reward_vault_address, job_manager_address, verifier_address, lp_token_address,router_address, factory_address, pool_address  ]=await registry_contract.get_system_addresses();
    cached_addresses = {access_manager_address,
        rpt_address, ethiocoin_address, treasury_address,   reward_vault_address, job_manager_address, verifier_address, lp_token_address,
        router_address,
        factory_address,
        pool_address,
        registry_address:config.registry};

    return cached_addresses;
}



