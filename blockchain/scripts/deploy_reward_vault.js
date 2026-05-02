import ethers from "./connect.js";

export default async function (registry, access_manager) {

    const reward_rate = process.env.REWARD_RATE;
    const reward_vault = await ethers.deployContract("RewardVault", [registry, access_manager, reward_rate]);
    await reward_vault.waitForDeployment();
    const reward_vault_address = await reward_vault.getAddress();
    console.log("RewardVault deployed to:", reward_vault_address);
    return reward_vault_address;
}