

import ethers from "./connect.js";

export default async function (registry, access_manager) {
        const [deployer] = await ethers.getSigners();
    const rpt = await ethers.deployContract("ReputationToken", [registry, access_manager]);
    await rpt.waitForDeployment();
    const tx_initial_mint= await rpt.mint(deployer.address, 100000000000000000000000000000n);
    await tx_initial_mint.wait();
    const rpt_address = await rpt.getAddress();
    console.log("ReputationToken deployed to:", rpt_address);
    return {rpt_address, rpt};
}