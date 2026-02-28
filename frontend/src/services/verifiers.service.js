import {get_contracts} from "./compose_contracts.service.js";
const {verifier_contract} = await get_contracts();

export async function register_verifier(address, cat, user_id){
        try {
            const tx_register = await verifier_contract.add_verifier(cat, address);
            await tx_register.wait();
            return true;
        }
        catch (error) {
                console.error(error);
                return false;
        }
}

export async function get_categories() {

        return await verifier_contract.get_categories();

}

export async function add_category(category) {
        try {

            const tx_add_category = await verifier_contract.add_category(category);
            await tx_add_category.wait();
            return true;
        }
        catch (error) {
                console.error(error);
                return false;
        }
}

export async function get_stack_levels() {
    try {

        return await verifier_contract.get_stack_levels();
    } catch (error) {
        console.error("Error getting stack levels:", error);
        return [];
    }
}

export async function add_stack_level(amount) {
    try {
        const tx = await verifier_contract.add_stack_level(amount);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error adding stack level:", error);
        return false;
    }
}

export async function set_up_vrf(sub_id, confs, key_hash, gas_limit) {
    try {
        const tx = await verifier_contract.set_up_vrf(sub_id, confs, key_hash, gas_limit);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error setting up VRF:", error);
        return false;
    }
}

export async function get_vrf_config() {
    try {
        const coordinator = await verifier_contract.s_vrfCoordinator();
        const sub_id = await verifier_contract.subscription_id();
        const key_hash = await verifier_contract.key_hash();
        const gas_limit = await verifier_contract.callback_gas_limit();
        const confs = await verifier_contract.request_confirmations();
        return { coordinator, sub_id: sub_id.toString(), key_hash, gas_limit: gas_limit.toString(), confs: confs.toString() };
    } catch (error) {
        console.error("Error getting VRF config:", error);
        return null;
    }
}

export async function get_slash_bps() {
    try {
        return await verifier_contract.slash_bps();
    } catch (error) {
        console.error("Error getting slash BPS:", error);
        return 0n;
    }
}

export async function set_slash_bps(bps) {
    try {
        const tx = await verifier_contract.set_slash_bps(bps);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error setting slash BPS:", error);
        return false;
    }
}

export async function get_verifier_data(address) {
    try {
        const verifier = await verifier_contract.verifiers(address);
        const pendingRewards = await verifier_contract.pending_rewards(address);
        return {
            verified: verifier.verified,
            isActive: verifier.is_active,
            assigned: verifier.assigned,
            inDispute: Number(verifier.in_dispute),
            locked: verifier.locked,
            staked: verifier.staked,
            category: Number(verifier.category),
            level: Number(verifier.level),
            idxL: Number(verifier.idx_l),
            pendingRewards: pendingRewards
        };
    } catch (error) {
        console.error("Error getting verifier data:", error);
        return null;
    }
}

export async function stake_rpt(amount) {
    try {
        const {rpt_contract} = await get_contracts();
        const verifier_address = await verifier_contract.getAddress();
        
        // Approve first
        const approve_tx = await rpt_contract.approve(verifier_address, amount);
        await approve_tx.wait();

        const tx = await verifier_contract.stake(amount);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error staking RPT:", error);
        return false;
    }
}

export async function unstake_rpt() {
    try {
        const tx = await verifier_contract.unstake();
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error unstaking RPT:", error);
        return false;
    }
}

export async function transfer_verifier_address(newAddress) {
    try {
        const tx = await verifier_contract.transfer_address(newAddress);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error transferring address:", error);
        return false;
    }
}