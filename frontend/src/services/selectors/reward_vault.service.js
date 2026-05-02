export default async function main(reward_vault) {
    const rv_address = await reward_vault.getAddress();
    const rv_selectors = ["set_reward_rate(uint256)"];
    return rv_selectors.map((signature, index) => ({target: rv_address, signature:signature, selector:reward_vault.interface.getFunction(signature).selector}));

}