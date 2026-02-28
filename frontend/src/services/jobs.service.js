import {get_contracts} from "./compose_contracts.service.js"
import {encodeBytes32String} from "ethers";
import {nanoid} from "nanoid";
import {get_categories} from "./verifiers.service.js";
import axios from "axios";
import connect_wallet from "./connect_wallet.service.js";
import {get_addresses} from "@/services/system_addresses.service.js";
import {get_allowance as get_eth_allowance} from "./eth_coin.service.js";
import {get_allowance as get_rpt_allowance} from "./rpt.service.js";

const {job_manager_contract} = await get_contracts();
const {signer} = await connect_wallet();
const addresses = await get_addresses();

export async function list_jobs() {
    const res = await axios.get("http://localhost:3333/api/jobs", { withCredentials: true });
    return res.data || [];
}

export async function calc_expense(amount) {
    try {
        const client_fee_portion = await get_client_fee_portion();
        const total_expense = BigInt(amount) + (BigInt(amount) * BigInt(client_fee_portion)) / 10000n;
        return total_expense;
    } catch (error) {
        console.error("Error calculating expense:", error);
        return BigInt(amount);
    }
}

export async function get_user_balance() {
    const {eth_contract} = await get_contracts();

    try {
        const address = await eth_contract.runner.getAddress();
        return await eth_contract.balanceOf(address);
    } catch (error) {
        console.error("Error getting user balance:", error);
        return 0n;
    }
}



export async function check_allowance(amount) {
    try {
        const total_expense = await calc_expense(amount);
        const userAddress = await signer.getAddress();
        const ethio_allowance = await get_eth_allowance(userAddress, addresses.job_manager_address);
        
        const levels = await job_manager_contract.get_levels();
        let level_index = 0;
        for(let i=0; i<levels.length; i++) {
            if (BigInt(levels[i].max_amount) >= BigInt(amount)) {
                level_index = i;
                break;
            }
            if (i === levels.length - 1) level_index = i;
        }
        const client_stake = levels[level_index].client_stake;
        const rpt_allowance = await get_rpt_allowance(userAddress, addresses.job_manager_address);
        
        return {
            ethio: {
                required: total_expense,
                allowed: ethio_allowance,
                sufficient: ethio_allowance >= total_expense
            },
            rpt: {
                required: client_stake,
                allowed: rpt_allowance,
                sufficient: rpt_allowance >= client_stake
            }
        };
    } catch (error) {
        console.error("Error checking allowance:", error);
        return null;
    }
}

export async function post_job(job) {
    try {
            
            const id = nanoid(31);
            const bytes_id = encodeBytes32String(id);
            const {category, cat_id, amount, max_duration, description, title, topics, bid_duration, skills, company} = job;

            const tx_post_job = await job_manager_contract.post_job(bytes_id, amount, max_duration, cat_id);
            await tx_post_job.wait();

            const response = await axios.post("http://localhost:3333/api/jobs", {bytes_id, title, description, topics, bid_duration, category, amount:amount.toString(), skills, company} ,{ withCredentials: true});
            return response.status === 201;
    } catch (error) {
            console.error("Error posting job:", error);
            return false;
    }
}

export async function get_post_configs() {

        const levels= await job_manager_contract.get_levels();
        const client_fee_portion= await job_manager_contract.client_fee_portion_bps();
        const categories= await get_categories();
        return {levels,client_fee_portion,categories};

}

export async function add_levels(levels) {
    try {
        for (const level of levels) {
            const tx_add_level = await job_manager_contract.append_level(level);
            await tx_add_level.wait();
        }
        return true;
    } catch (error) {
        console.error("Error adding levels:", error);
        return false;
    }
}

export async function append_level(level) {
    try {
        const tx_add_level = await job_manager_contract.append_level(level);
        await tx_add_level.wait();
        return true;
    } catch (error) {
        console.error("Error adding level:", error);
        return false;
    }
}

export async function set_client_fee_portion(portion) {
    try {
        const tx_set_client_fee_portion = await job_manager_contract.set_client_fee_portion(portion);
        await tx_set_client_fee_portion.wait();
        return true;
    } catch (error) {
        console.error("Error setting client fee portion:", error);
        return false;
    }
}

export async function get_levels_count() {
    try {
        const count = await job_manager_contract.levels_size();
        return Number(count);
    } catch (error) {
        console.error("Error getting levels count:", error);
        return 0;
    }
}

export async function get_level(index) {
    try {
        const level = await job_manager_contract.get_level(index);
        return {
            min_verifiers_portion: level.min_verifiers_portion.toString(),
            freelancer_stake: level.freelancer_stake.toString(),
            client_stake: level.client_stake.toString(),
            max_amount: level.max_amount.toString(),
            payment_duration: level.payment_duration.toString()
        };
    } catch (error) {
        console.error("Error getting level:", error);
        return null;
    }
}

export async function get_client_fee_portion() {
    try {
        const portion = await job_manager_contract.client_fee_portion_bps();
        return Number(portion);
    } catch (error) {
        console.error("Error getting client fee portion:", error);
        return 0;
    }
}

export async function get_job_bids(id) {
    try {
        const response = await axios.get(`http://localhost:3333/api/jobs/${id}/bids`, { withCredentials: true });
        return response.data.data || [];
    } catch (error) {
        console.error("Error getting job bids:", error);
        return [];
    }
}

export async function post_bid_api(bid) {
    try {
        const response = await axios.post(`http://localhost:3333/api/jobs/bid/${bid.id}`, bid, { withCredentials: true });
        return response.status === 201;
    } catch (error) {
        console.error("Error posting bid:", error);
        return false;
    }
}

export async function get_job_api(id) {
    try {
        const response = await axios.get(`http://localhost:3333/api/jobs/${id}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error("Error getting job details from API:", error);
        return null;
    }
}

export async function get_job_blockchain(id) {
    try {

        const job = await job_manager_contract.jobs(id);
        return {
            amount: job.amount.toString(),
            duration: job.max_duration.toString(),
            level: job.level.toString(),
            status: job.status.toString(),
            freelancer_completed: job.freelancer_completed,
            expiry_timestamp: job.expiry_timestamp.toString(),
            freelancer: job.freelancer
        };
    } catch (error) {
        console.error("Error getting job from blockchain:", error);
        return null;
    }
}


export async function hire(job_id, freelancer_address) {
        try {
                const tx_hire = await job_manager_contract.hire(job_id, freelancer_address);
                await tx_hire.wait();
                return true;
        } catch (error) {
                console.error("Error hiring freelancer:", error);
                return false;
        }
}

export async function cancel_job(job_id) {
        try {
                const tx_cancel = await job_manager_contract.cancel_job(job_id);
                await tx_cancel.wait();
                return true;
        } catch (error) {
                console.error("Error canceling job:", error);
                return false;
        }
}

export async function cancel_pending_hire(job_id) {
        try {
                const tx_cancel_pending_hire = await job_manager_contract.cancel_pending_hire(job_id);
                await tx_cancel_pending_hire.wait();
                return true;
        } catch (error) {
                console.error("Error canceling pending hire:", error);
                return false;
        }
}

export async function accept_work(job_id) {
        try {
                const tx_accept_work = await job_manager_contract.accept_job(job_id);
                await tx_accept_work.wait();
                return true;
        } catch (error) {
                console.error("Error accepting work:", error);
                return false;
        }
}

export async function cancel_hire(job_id) {
        try {
                const tx_cancel_hire = await job_manager_contract.cancel_hire(job_id);
                await tx_cancel_hire.wait();
                return true;
        } catch (error) {
                console.error("Error canceling hire:", error);
                return false;
        }
}

export async function complete_job(job_id) {
        try {
                const tx_complete = await job_manager_contract.complete_job(job_id);
                await tx_complete.wait();
                return true;
        } catch (error) {
                console.error("Error completing job:", error);
                return false;
        }
}

export async function pay_freelancer(job_id) {
        try {
                const tx_pay_freelancer = await job_manager_contract.pay_freelancer(job_id);
                await tx_pay_freelancer.wait();
                return true;
        } catch (error) {
                console.error("Error paying freelancer:", error);
                return false;
        }
}

export async function raise_dispute(job_id) {
        try {
                const tx_raise_dispute = await job_manager_contract.raise_dispute(job_id);
                await tx_raise_dispute.wait();
                return true;
        } catch (error) {
                console.error("Error raising dispute:", error);
                return false;
        }
}

export async function claim_reward(job_id) {
        try {
                const tx_claim_reward = await job_manager_contract.claim_after_dispute(job_id);
                await tx_claim_reward.wait();
                return true;
        } catch (error) {
                console.error("Error claiming reward:", error);
                return false;
        }
}

export async function check_freelancer_allowance(job_id) {
    try {
        const userAddress = await signer.getAddress();
        const job = await job_manager_contract.jobs(job_id);
        const level = await job_manager_contract.get_level(job.level);
        
        const freelancer_fee_portion = await job_manager_contract.freelancer_fee_portion_bps();
        const fee = (BigInt(job.amount) * BigInt(freelancer_fee_portion)) / 10000n;
        
        const ethio_allowance = await get_eth_allowance(userAddress, addresses.job_manager_address);
        const rpt_allowance = await get_rpt_allowance(userAddress, addresses.job_manager_address);
        
        return {
            ethio: {
                required: fee,
                allowed: ethio_allowance,
                sufficient: ethio_allowance >= fee
            },
            rpt: {
                required: level.freelancer_stake,
                allowed: rpt_allowance,
                sufficient: rpt_allowance >= level.freelancer_stake
            }
        };
    } catch (error) {
        console.error("Error checking freelancer allowance:", error);
        return null;
    }
}

export async function refund_client(job_id) {
        try {
                const tx_refund_client = await job_manager_contract.refund_after_dispute(job_id);
                await tx_refund_client.wait();
                return true;
        } catch (error) {
                console.error("Error refunding client:", error);
                return false;
        }
}