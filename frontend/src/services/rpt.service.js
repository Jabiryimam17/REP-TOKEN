import {get_contracts} from "./compose_contracts.service.js";

export async function get_user_balance() {
    const {rpt_contract} = await get_contracts();

            const address = await rpt_contract.runner.getAddress();
        return await rpt_contract.balanceOf(address);
}

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

export async function transfer(address, amount) {
    const {rpt_contract} = await get_contracts();
    try {
        const tx = await rpt_contract.transfer(address, amount);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error transferring RPT:", error);
        return false;
    }

}
export async function approve(spender, amount) {
    const {rpt_contract} = await get_contracts();
    try {
        const tx = await rpt_contract.approve(spender, amount);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error approving RPT:", error);
        return false;
    }
}

export async function get_allowance(owner, spender) {
    const {rpt_contract} = await get_contracts();

    try {
        return await rpt_contract.allowance(owner, spender);
    } catch (error) {
        console.error("Error getting allowance:", error);
        return 0n;
    }
}