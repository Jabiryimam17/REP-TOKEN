import connect_wallet from './connect_wallet.service.js';
import {abi as system_registry_abi} from '../abis/Registry.json' with {type:"json"};

import addresses from "./system_addresses.service.js";
import {ethers} from "ethers";
const {signer} = await connect_wallet();
const system_registry = new ethers.Contract(addresses.registry_address, system_registry_abi, signer);
export  async function add_roles(input) {



        const tx_add_roles=await system_registry.add_roles(input);
        await tx_add_roles.wait();
}

export async function get_roles() {
        return await system_registry.get_roles();
}