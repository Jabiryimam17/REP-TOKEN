export default async function main(treasury) {
    const treasury_address = await treasury.getAddress();
    const treasury_selectors = ["withdraw_tokens(address,uint256)", "allocate_stable_coin(address, uint256)", "deallocate_stable_coin(address, uint256)", "transfer_allocated_stable_coin(address,uint256)", "fill_reward_vault(uint256)", "swap_reputation_for_stable(uint256, uint256)", "swap_stable_for_reputation(uint256, uint256)", "buy_back(uint256, address)"]
    return treasury_selectors.map((signature, index) => ({
        target: treasury_address,
        signature:signature,
        selector: treasury.interface.getFunction(signature).selector
    }));
}