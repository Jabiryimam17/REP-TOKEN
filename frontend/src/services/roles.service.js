
import connect_wallet from './connect_wallet.service.js';
import {abi as system_registry_abi} from '../abis/Registry.json' with {type:"json"};

import {get_addresses} from "./system_addresses.service.js";
import {ethers} from "ethers";
const {signer} = await connect_wallet();
export  async function add_roles(input) {
        const addresses=await get_addresses();
        const system_registry = new ethers.Contract(addresses.registry_address, system_registry_abi, signer);
        const tx_add_roles=await system_registry.add_roles(input);
        await tx_add_roles.wait();
}

export async function get_roles() {
        const addresses=await get_addresses();
        const system_registry = new ethers.Contract(addresses.registry_address, system_registry_abi, signer);
        return await system_registry.get_roles();
}