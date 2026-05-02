import { get_contracts } from "./compose_contracts.service.js";
import { get_addresses } from "./system_addresses.service.js";
import { ethers } from "ethers";

/**
 * Ensures that the spender has enough allowance from the owner for the given token.
 */
export async function ensure_allowance(tokenContract, spender, amountNeeded) {
    const owner = await tokenContract.runner.getAddress();
    const currentAllowance = await tokenContract.allowance(owner, spender);
    
    if (currentAllowance < amountNeeded) {
        const tx = await tokenContract.approve(spender, amountNeeded);
        await tx.wait();
        return true;
    }
    return false;
}

export async function stake_lp(amount) {
    const { reward_vault_contract, rpt_contract } = await get_contracts();
    const addresses = await get_addresses();
    const lpAddr = addresses.lp_token_address;
    const vaultAddr = await reward_vault_contract.getAddress();
    
    const lpContract = new ethers.Contract(lpAddr, [
        "function allowance(address,address) view returns (uint256)",
        "function approve(address,uint256) returns (bool)",
        "function balanceOf(address) view returns (uint256)"
    ], reward_vault_contract.runner);
    
    await ensure_allowance(lpContract, vaultAddr, amount);
    
    return await reward_vault_contract.stake(amount);
}

export async function withdraw_lp(amount) {
    const { reward_vault_contract } = await get_contracts();
    return await reward_vault_contract.withdraw(amount);
}

export async function get_vault_stats(userAddress) {
    const { reward_vault_contract, rpt_contract } = await get_contracts();
    const addresses = await get_addresses();
    const lpAddr = addresses.lp_token_address;
    
    const lpContract = new ethers.Contract(lpAddr, [
        "function balanceOf(address) view returns (uint256)",
        "function allowance(address,address) view returns (uint256)"
    ], reward_vault_contract.runner);
    
    const [lpBal, rptBal, allowance, user, totalStaked, rewardRate, accRewardPerShare, lastReward] = await Promise.all([
        lpContract.balanceOf(userAddress),
        rpt_contract.balanceOf(userAddress),
        lpContract.allowance(userAddress, await reward_vault_contract.getAddress()),
        reward_vault_contract.liqudators(userAddress),
        reward_vault_contract.total_staked(),
        reward_vault_contract.reward_rate(),
        reward_vault_contract.acc_reward_per_share(),
        reward_vault_contract.last_reward_time(),
    ]);

    return {
        lpBal,
        rptBal,
        allowance,
        user,
        totalStaked,
        rewardRate,
        accRewardPerShare,
        lastReward
    };
}
