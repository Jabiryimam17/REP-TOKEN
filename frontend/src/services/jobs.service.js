import {get_contracts} from "./compose_contracts.service.js"
import {Contract, encodeBytes32String} from "ethers";
import {nanoid} from "nanoid";
import {get_categories} from "./verifiers.service.js";
import api from "../utils/api.js";
import connect_wallet from "./connect_wallet.service.js";
import {get_addresses} from "@/services/system_addresses.service.js";
import {get_allowance as get_eth_allowance} from "./eth_coin.service.js";
import {get_allowance as get_rpt_allowance} from "./rpt.service.js";
import vrf_wrapper_abi from "../abis/IVRFV2Wrapper.json" with {type: "json"};
import { ethers } from "ethers";
// JobPayingSystem enum order changed (DISPUTED moved before COMPLETED).
// Normalize to the legacy ordering expected by the UI: COMPLETED => 4, DISPUTED => 5.

export async function list_jobs(filters = {}) {
    const res = await api.get("/api/jobs", { params: filters });
    return res.data || [];
}

export async function calc_expense(amount) {
    try {
        const client_fee_portion = await get_client_fee_portion();
        const amountBI = BigInt(amount);
        return amountBI + (amountBI * BigInt(client_fee_portion)) / 10000n;
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
        const {job_manager_contract} = await get_contracts();
        const {signer} = await connect_wallet();
        const addresses = await get_addresses();

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
        const client_stake = BigInt(levels[level_index].client_stake);
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
            const {job_manager_contract} = await get_contracts();
            const id = nanoid(31);
            const bytes_id = encodeBytes32String(id);
            const {category, cat_id, amount, max_duration, description, title, topics, bid_duration, skills, company} = job;

            const tx_post_job = await job_manager_contract.post_job(bytes_id, amount, max_duration, cat_id);
            await tx_post_job.wait();

            const response = await api.post("/api/jobs", {bytes_id, title, description, topics, bid_duration, category, amount:amount.toString(), skills, company});
            return response.status === 201;
    } catch (error) {
            console.error("Error posting job:", error);
            return false;
    }
}

export async function get_post_configs() {
        const {job_manager_contract, verifier_contract} = await get_contracts();
        const levels= await job_manager_contract.get_levels();
        const client_fee_portion= await job_manager_contract.client_fee_portion_bps();
        const categories= await get_categories();
        let vrf_wrapper_address = "";
        try {
            const config = await verifier_contract.get_request_config();
            vrf_wrapper_address = config[1];
        } catch (e) {
            console.error("Error fetching VRF config:", e);
        }
        return {levels,client_fee_portion,categories, vrf_wrapper_address};

}

export async function add_levels(levels) {
    try {
        const {job_manager_contract} = await get_contracts();
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
        const {job_manager_contract} = await get_contracts();
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
        const {job_manager_contract} = await get_contracts();
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
        const {job_manager_contract} = await get_contracts();
        const levels = await job_manager_contract.get_levels();
        return levels.length;
    } catch (error) {
        console.error("Error getting levels count:", error);
        return 0;
    }
}

export async function get_level(index) {
    try {
        const {job_manager_contract} = await get_contracts();
        const level = await job_manager_contract.work_levels(index);
        return {
            verifiers_cnt: level.verifiers_cnt.toString(),
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
        const {job_manager_contract} = await get_contracts();
        const portion = await job_manager_contract.client_fee_portion_bps();
        return Number(portion);
    } catch (error) {
        console.error("Error getting client fee portion:", error);
        return 0;
    }
}

export async function get_job_bids(id) {
    try {
        const response = await api.get(`/api/jobs/${id}/bids`);
        return response.data.data || [];
    } catch (error) {
        console.error("Error getting job bids:", error);
        return [];
    }
}

export async function post_bid_api(bid) {
    try {
        const response = await api.post(`/api/jobs/bid/${bid.id}`, bid);
        return response.status === 201;
    } catch (error) {
        console.error("Error posting bid:", error);
        return false;
    }
}

export async function get_job_api(id) {
    try {
        const response = await api.get(`/api/jobs/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error getting job details from API:", error);
        return null;
    }
}

export async function get_job_blockchain(id) {
    try {
        const {job_manager_contract} = await get_contracts();
        const job = await job_manager_contract.jobs(id);
        console.log("job: ", job);
        const status = Number(job.status);
        console.log("status: ", status);
        return {
            client: job.client,
            freelancer: job.freelancer,
            freelancer_stake: job.freelancer_stake.toString(),
            client_stake: job.client_stake.toString(),
            verifiers_cnt: job.verifiers_cnt.toString(),
            payment_duration: job.payment_duration.toString(),
            appeal_time: job.appeal_time.toString(),
            status: status.toString(),
            amount: job.amount.toString(),
            max_duration: job.max_duration.toString(),
            expiry_timestamp: job.expiry_timestamp.toString(),
            category: job.cat.toString()
        };
    } catch (error) {
        console.error("Error getting job from blockchain:", error);
        return null;
    }
}


export async function hire(job_id, freelancer_address) {
        try {
                const {job_manager_contract} = await get_contracts();
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
                const {job_manager_contract} = await get_contracts();
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
                const {job_manager_contract} = await get_contracts();
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
                const {job_manager_contract} = await get_contracts();
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
                const {job_manager_contract} = await get_contracts();
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
                const {job_manager_contract} = await get_contracts();
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
                const {job_manager_contract} = await get_contracts();
                const tx_pay_freelancer = await job_manager_contract.pay_freelancer(job_id);
                await tx_pay_freelancer.wait();
                return true;
        } catch (error) {
                console.error("Error paying freelancer:", error);
                return false;
        }
}

export async function check_link_allowance(amount) {
    try {
        const {signer, provider} = await connect_wallet();
        const addresses = await get_addresses();
        const userAddress = await signer.getAddress();
        const link_token_address = process.env.NEXT_PUBLIC_LINK_TOKEN || "0x779877A7B0D9E8603169DdbD7836e478b4624789";
        const link_abi = ["function allowance(address owner, address spender) view returns (uint256)", "function approve(address spender, uint256 amount) returns (bool)"];
        const link_contract = new ethers.Contract(link_token_address, link_abi, signer);

        const allowance = await link_contract.allowance(userAddress, addresses.job_manager_address);
        return {
            allowed: allowance,
            sufficient: allowance >= amount
        };
    } catch (error) {
        console.error("Error checking link allowance:", error);
        return null;
    }
}

export async function approve_link(amount) {
    try {
        const {signer, provider} = await connect_wallet();
        const addresses = await get_addresses();
        const link_token_address = process.env.NEXT_PUBLIC_LINK_TOKEN || "0x779877A7B0D9E8603169DdbD7836e478b4624789";
        const link_abi = ["function approve(address spender, uint256 amount) returns (bool)"];
        const link_contract = new ethers.Contract(link_token_address, link_abi, signer);

        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei");

        const tx = await link_contract.approve(addresses.job_manager_address, amount, { gasPrice });
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error approving LINK:", error);
        return false;
    }
}

export async function raise_dispute(job_id, pay_link, fee_amount, reason, details) {
    const {job_manager_contract} = await get_contracts();
    const addresses = await get_addresses();
    const {provider, signer} = await connect_wallet();

    try {
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei");
        console.log("pay link: ", pay_link, " fee amount: ", fee_amount, " reason: ", reason, " details: ", details, " gas price: ", gasPrice, "")
        // const tx_raise_dispute = await job_manager_contract.raise_dispute(job_id, pay_link, {
        //     value: pay_link ? ethers.parseUnits("1", "wei") : fee_amount,
        //     gasPrice,
        //     gasLimit: 1000000
        // });
        // await tx_raise_dispute.wait();

        const userAddress = await signer.getAddress();
        await api.post("/api/disputes/post", {
            dispute: {
                job: job_id,
                issuer: userAddress,
                reason: reason,
                details: details
            }
        });

        return true;
    } catch (error) {
        console.error("Error raising dispute:", error);
        return false;
    }
}

export async function get_dispute_context(job_id) {
    try {
        const { job_manager_contract, verifier_contract } = await get_contracts();
        const job = await job_manager_contract.jobs(job_id);
        const categories = await get_categories();
        const category_id = Number(job.cat);

        // Verifier level calculation based on find_lower_bound in VerifierSystem.sol
        // find_lower_bound(uint stake_amount) is left-biased: mid = (low + high) >> 1
        const total_stake = BigInt(job.client_stake) + BigInt(job.freelancer_stake);
        const stack_levels = await verifier_contract.get_stack_levels();
        
        let verifier_level = 0;
        if (stack_levels.length > 0) {
            let n = stack_levels.length;
            let low = 0;
            let high = n - 1;
            while (low < high) {
                let mid = Math.floor((low + high) / 2);
                if (BigInt(stack_levels[mid]) < total_stake) {
                    low = mid + 1;
                } else {
                    high = mid;
                }
            }
            verifier_level = low;
        }

        let verifier_count = 0;
        try {
            // Count verifiers at the calculated verifier_level
            for (let i = 0; i < 1000; i++) {
                try {
                    await verifier_contract.leveled_verifiers(category_id, verifier_level, i);
                    verifier_count++;
                } catch (e) {
                    break;
                }
            }
        } catch (e) {
            console.error("Error getting verifier count:", e);
        }

        return {
            job: {
                category_id: category_id,
            },
            level: {
                client_stake: job.client_stake.toString(),
                freelancer_stake: job.freelancer_stake.toString(),
                verifiers_cnt: job.verifiers_cnt.toString(),
                payment_duration: job.payment_duration.toString()
            },
            verifier_level: verifier_level,
            total_stake: total_stake.toString(),
            category_name: categories[category_id] || "Unknown",
            verifier_count: verifier_count
        };
    } catch (error) {
        console.error("Error getting dispute context:", error);
        return null;
    }
}

export async function estimate_dispute_fee(job_id, pay_link) {
    const {verifier_contract, job_manager_contract} = await get_contracts();
    const {provider, signer} = await connect_wallet();
    try {
        const job = await job_manager_contract.jobs(job_id);
        const min_v_p = job.verifiers_cnt;
        
        const [callback_gas_limit, vrf_wrapper_address] = await verifier_contract.get_request_config();
        const vrf_wrapper = new Contract(vrf_wrapper_address, vrf_wrapper_abi, signer);
        
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei");

        let fee;
        if (pay_link) {
            fee = await vrf_wrapper.estimateRequestPrice(callback_gas_limit, min_v_p, gasPrice);
        } else {
            fee = await vrf_wrapper.estimateRequestPriceNative(callback_gas_limit, min_v_p, gasPrice);
        }
        return fee;
    } catch (error) {
        console.error("Error estimating dispute fee:", error);
        return 0n;
    }
}

export async function claim_reward(job_id) {
        try {
                const {job_manager_contract} = await get_contracts();
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
        const {job_manager_contract} = await get_contracts();
        const {signer} = await connect_wallet();
        const addresses = await get_addresses();

        const userAddress = await signer.getAddress();
        const job = await job_manager_contract.jobs(job_id);
        
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
                required: job.freelancer_stake,
                allowed: rpt_allowance,
                sufficient: rpt_allowance >= job.freelancer_stake
            }
        };
    } catch (error) {
        console.error("Error checking freelancer allowance:", error);
        return null;
    }
}

export async function refund_client(job_id) {
        try {
                const {job_manager_contract} = await get_contracts();
                const tx_refund_client = await job_manager_contract.refund_after_dispute(job_id);
                await tx_refund_client.wait();
                return true;
        } catch (error) {
                console.error("Error refunding client:", error);
                return false;
        }
}
