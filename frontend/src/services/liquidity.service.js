import { get_contracts } from "./compose_contracts.service.js";
import { ethers } from "ethers";

/**
 * Ensures that the spender has enough allowance from the owner for the given token.
 * If the current allowance is less than the required amount, it increases it.
 * Uses a safe approach by only approving what is needed if it's not already sufficient.
 * @param {ethers.Contract} token_contract - The ERC20 token contract.
 * @param {string} spender - The address to grant allowance to.
 * @param {bigint} amountNeeded - The required amount.
 */
export async function ensure_allowance(token_contract, spender, amountNeeded) {
    const owner = await token_contract.runner.getAddress();
    const currentAllowance = await token_contract.allowance(owner, spender);
    
    if (currentAllowance < amountNeeded) {
        // For security, some tokens require setting allowance to 0 first, 
        // but here we follow the user request for "safeIncreaseAllowance" logic style.
        // We'll just approve the needed amount (or MaxUint256 for convenience, 
        // but usually specific amount is safer if requested specifically).
        // The user asked for safeIncreaseAllowance for security purpose.
        
        const tx = await token_contract.approve(spender, amountNeeded);
        await tx.wait();
        return true;
    }
    return false;
}

export async function get_amounts_out(amountIn, path) {
    const { router_contract } = await get_contracts();
    return await router_contract.getAmountsOut(amountIn, path);
}

export async function swap_exact_tokens_for_tokens(amountIn, amountOutMin, path, to, deadline) {
    const { router_contract, rpt_contract, eth_contract } = await get_contracts();
    
    // Determine which token to check allowance for
    const tokenInAddress = path[0];
    const rptAddress = await rpt_contract.getAddress();
    const ethAddress = await eth_contract.getAddress();
    const routerAddress = await router_contract.getAddress();
    
    const tokenContract = tokenInAddress.toLowerCase() === rptAddress.toLowerCase() ? rpt_contract : eth_contract;
    
    await ensure_allowance(tokenContract, routerAddress, amountIn);
    
    return await router_contract.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        to,
        deadline
    );
}

export async function add_liquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline) {
    const { router_contract, rpt_contract, eth_contract } = await get_contracts();
    const routerAddress = await router_contract.getAddress();
    
    const rptAddress = await rpt_contract.getAddress();
    const ethAddress = await eth_contract.getAddress();
    
    // Ensure allowances for both tokens
    if (tokenA.toLowerCase() === rptAddress.toLowerCase()) {
        await ensure_allowance(rpt_contract, routerAddress, amountADesired);
    } else if (tokenA.toLowerCase() === ethAddress.toLowerCase()) {
        await ensure_allowance(eth_contract, routerAddress, amountADesired);
    }
    
    if (tokenB.toLowerCase() === rptAddress.toLowerCase()) {
        await ensure_allowance(rpt_contract, routerAddress, amountBDesired);
    } else if (tokenB.toLowerCase() === ethAddress.toLowerCase()) {
        await ensure_allowance(eth_contract, routerAddress, amountBDesired);
    }
    
    return await router_contract.addLiquidity(
        tokenA,
        tokenB,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        to,
        deadline,
        { gasLimit: 3_000_000 }
    );
}
