import {get_contracts} from "./compose_contracts.service.js"


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
    const {eth_contract} = await get_contracts();
    // For direct transfers, we don't usually need allowance unless it's transferFrom.
    // However, if the user wants to ensure allowance for some reason (e.g. for a contract to pull tokens),
    // they can use this. But the standard transfer(to, amount) doesn't use allowance.
    // If they meant for things like Swap/RewardVault, I've already handled that.
    // In TransferPage, it's a direct transfer.
    try {
        const tx = await eth_contract.transfer(address, amount);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error transferring EthioCoin:", error);
        return false;
    }

}

export async function approve(spender, amount) {
    const {eth_contract} = await get_contracts();
    try {
        const tx = await eth_contract.approve(spender, amount);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error approving EthioCoin:", error);
        return false;
    }
}

export async function get_allowance(owner, spender) {
    const {eth_contract} = await get_contracts();

    try {
        return await eth_contract.allowance(owner, spender);
    } catch (error) {
        console.error("Error getting allowance:", error);
        return 0n;
    }
}