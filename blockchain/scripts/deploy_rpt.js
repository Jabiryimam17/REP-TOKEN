

import ethers from "./connect.js";

export default async function ( access_manager) {
        const [deployer] = await ethers.getSigners();
    const rpt = await ethers.deployContract("ReputationToken", [access_manager]);
    await rpt.waitForDeployment();
    const rpt_address = await rpt.getAddress();

    console.log("ReputationToken deployed to:", rpt_address);
    const amount = ethers.parseUnits('1000000', 18);
    const tx_rpt_mint = await rpt.mint(deployer.address, amount);
    await tx_rpt_mint.wait();
    return {rpt_address, rpt};
}

