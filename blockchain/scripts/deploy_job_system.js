
import ethers from './connect.js';
import dotenv from 'dotenv';
dotenv.config();
export default async function (registry, access_manager) {

    const job_system=await ethers.deployContract("JobPayingSystem", [ registry, access_manager]);

    await job_system.waitForDeployment();
    const job_system_address=await job_system.getAddress();
    console.log("JobPayingSystem deployed to:",job_system_address);
    return job_system_address;
}