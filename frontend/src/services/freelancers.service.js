import {get_contracts} from "./compose_contracts.service.js"
import connect_wallet from "./connect_wallet.service.js"
import axios from "axios";
const {job_manager_contract} = await get_contracts();

export async function transfer_address(new_address) {
        const {signer} = await connect_wallet();
        const old_address = await signer.getAddress();
        const tx_transfer=await job_manager_contract.connect(signer).transfer_freelancer(new_address);
        await tx_transfer.wait();
        return old_address;
}

export async function register_freelancer(address, initial_level, user_id) {
        try {

            const {signer} = await connect_wallet();
            console.log(address);
            const tx_register = await job_manager_contract.connect(signer).register_freelancer(address, initial_level);
            await tx_register.wait();
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
}

export async function get_freelancers() {}
