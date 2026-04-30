
import ethers from './connect.js';
import "../env.js";
export default async function main(registry, access_manager) {

    const job_system=await ethers.deployContract("JobPayingSystem", [ registry, access_manager]);


    await job_system.waitForDeployment();
    const job_system_address=await job_system.getAddress();
    console.log("JobPayingSystem deployed to:",job_system_address);

    await prepare_levels(job_system);
    return job_system_address;
}

export async function prepare_levels(job_manager) {
    const levels = [
        {
            max_amount: ethers.parseUnits("100", 18),
            client_stake: ethers.parseUnits("10", 18),
            freelancer_stake: ethers.parseUnits("4", 18),
            verifiers_cnt: 1,
            payment_duration: 4 * 24 * 3600
        },
        {
            max_amount: ethers.parseUnits("1000", 18),
            client_stake: ethers.parseUnits("50", 18),
            freelancer_stake: ethers.parseUnits("20", 18),
            verifiers_cnt: 1,
            payment_duration: 7 * 24 * 3600
        },
        {
            max_amount: ethers.parseUnits("10000", 18),
            client_stake: ethers.parseUnits("200", 18),
            freelancer_stake: ethers.parseUnits("100", 18),
            verifiers_cnt: 2,
            payment_duration: 14 * 24 * 3600
        },
        {
            max_amount: ethers.parseUnits("100000", 18),
            client_stake: ethers.parseUnits("500", 18),
            freelancer_stake: ethers.parseUnits("200", 18),
            verifiers_cnt: 2,
            payment_duration: 21 * 24 * 3600
        },
        {
            max_amount: ethers.parseUnits("1000000", 18),
            client_stake: ethers.parseUnits("2000", 18),
            freelancer_stake: ethers.parseUnits("1000", 18),
            verifiers_cnt: 500,
            payment_duration: 30 * 24 * 3600
        }
    ];
    console.log("Resetting levels...");

    for (const level of levels) {
        const tx = await job_manager.reset_levels(levels);
        await tx.wait();
    }
}

export async function deploy_job_single(registry_address, access_manager) {
    // Minimal ABI for the registry function
    const registry_abi = [
        "function set_job_manager(address _job_manager) external"
    ];

    // Connect to the registry contract using Hardhat signer
    const [deployer] = await ethers.getSigners();
    const registry_contract = new ethers.Contract(registry_address, registry_abi, deployer);

    // Deploy the new Job System
    const new_job_address = await main(registry_address, access_manager);

    // Update the registry with the new job system
    const tx = await registry_contract.set_job_manager(new_job_address);
    await tx.wait();

    console.log("Registry updated with new JobManager:", new_job_address);

    return new_job_address;
}

await deploy_job_single('0x199273a89A51941238F3822b591b19C1Be041bbA', '0xc399a65f883de011c294C680c6e602E9f894DDE0');