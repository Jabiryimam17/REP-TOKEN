
import ethers from './connect.js';
import dotenv from 'dotenv';
dotenv.config({path:'../.env'});
import deploy_ethiocoin from './deploy_ethiocoin.js';
import deploy_job_system from "./deploy_job_system.js";
import deploy_reward_vault from "./deploy_reward_vault.js";
import deploy_treasury from "./deploy_treasury.js";
import deploy_rpt from "./deploy_rpt.js";
import deploy_verifier from "./deploy_verifier.js";
import deploy_pool from "./deploy_pool.js";
import export_abis from "./export_abis.js";
import write_registry from "./write_registry.js";

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const access_manager = await ethers.deployContract("RPTAccessManager");
    await access_manager.waitForDeployment();
    const access_manager_address=await access_manager.getAddress();
    console.log("AccessManager deployed to:", access_manager_address);

    const registry = await ethers.deployContract("Registry",[access_manager_address]);
    await registry.waitForDeployment();
    const registry_address=await registry.getAddress();
    console.log("Registry deployed to:", registry_address);




    const {ethiocoin,ethiocoin_address} = await deploy_ethiocoin();
    const {rpt_address, rpt} = await deploy_rpt(access_manager_address);
    const job_system_address = await deploy_job_system(registry_address, access_manager_address);
    const verifier_address = await deploy_verifier(registry_address, access_manager_address);


    const reward_vault_address = await deploy_reward_vault(registry_address, access_manager_address);

    const treasury_address = await deploy_treasury(registry_address, access_manager_address);



    const {factory_address, pool_address, router_address}=await deploy_pool(ethiocoin_address, rpt_address);
    console.log("Wiring registry...");

    const tx_e=await registry.set_ethiocoin(ethiocoin_address);
    await tx_e.wait();
    const tx_j=await registry.set_job_manager(job_system_address);
    await tx_j.wait();
    const tx_v=await registry.set_verifier(verifier_address);
    await tx_v.wait();
    const tx_rv=await registry.set_reward_vault(reward_vault_address);
    await tx_rv.wait();
    const tx_t=await registry.set_treasury(treasury_address);
    await tx_t.wait();
    const tx_rpt=await registry.set_rpt(rpt_address);
    await tx_rpt.wait();
    const tx_factory= await registry.set_factory(factory_address);
    await tx_factory.wait();
    const tx_pool=await registry.set_pool(pool_address);
    await tx_pool.wait();
    const tx_router = await registry.set_router(router_address);
    await tx_router.wait();

    console.log("Wired registry!!!")

    console.log("Exporting ABIs...");
    await export_abis();
    console.log("Exported ABIs!!!");

    console.log("Writing registry address...");
    await write_registry(registry_address);
    console.log("Wrote registry address!!!");



}

await main();