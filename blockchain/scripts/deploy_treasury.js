import ethers from "./connect.js";
export default async function (registry, access_manager) {
    const treasury = await ethers.deployContract("Treasury",[registry, access_manager]);
    await treasury.waitForDeployment();
    const treasury_address = await treasury.getAddress();
    console.log("Treasury deployed to:", treasury_address);
    return treasury_address;
}