import ethers from "./connect.js";
export default async function main (registry, access_manager) {
    const treasury = await ethers.deployContract("Treasury",[registry, access_manager]);
    await treasury.waitForDeployment();
    const treasury_address = await treasury.getAddress();
    console.log("Treasury deployed to:", treasury_address);
    return treasury_address;
}


export async function deploy_treasury_single(registry_address, access_manager) {
    const registry_abi = [
        "function set_treasury(address _treasury) external"
    ]
    const [deployer] = await ethers.getSigners();
    const registry_contract = new ethers.Contract(registry_address, registry_abi, deployer);
    const treasury_address=await main(registry_address, access_manager);
    const tx_set_treasury = await registry_contract.set_treasury(treasury_address);
    await tx_set_treasury.wait();

    console.log("Registry updated with new Treasury:", treasury_address);
    return treasury_address;
}

await deploy_treasury_single('0x7915f54253485bba062a49fD3Ce1B296552f7948','0x40D2Cd6BaCE480DF49bAFcCE1635d3CeB3168b99');