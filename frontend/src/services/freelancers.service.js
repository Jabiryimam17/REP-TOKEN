import {get_contracts} from "./compose_contracts.service.js"
import connect_wallet from "./connect_wallet.service.js"
const {job_manager_contract} = await get_contracts();

export async function transfer_address(new_address) {
        const {signer} = await connect_wallet();
        const old_address = await signer.getAddress();
        const tx_transfer=await job_manager_contract.connect(signer).transfer_freelancer(new_address);
        await tx_transfer.wait();
        return old_address;
}

export async function register_freelancer(address) {
        try {

            const {signer} = await connect_wallet();
            const tx_register = await job_manager_contract.connect(signer).register_freelancer(address);
            await tx_register.wait();
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
}

export async function get_freelancer(freelancer_address) {
    try {
        const freelancer = await job_manager_contract.freelancers(freelancer_address);
        freelancer.level = freelancer.successful_jobs*10/max(1,freelancer.total_jobs);
        return freelancer;
    }
    catch (error) {
        console.log("error: ", error);
    }
}
