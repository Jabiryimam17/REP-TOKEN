import  {ethers} from "ethers";
import "../env.js"
import registry_config from "../artifacts/contracts/Registry.sol/Registry.json" with {type: "json"};
import job_config from "../artifacts/contracts/JobPayingSystem.sol/JobPayingSystem.json" with {type: "json"};
import verifier_config from "../artifacts/contracts/VerifierSystem.sol/VerifierSystem.json" with {type: "json"};
import rpt_config from "../artifacts/contracts/ReputationToken.sol/ReputationToken.json" with {type: "json"};
import ethcoin_config from "../artifacts/contracts/EthioCoin.sol/EthioCoin.json" with {type: "json"};

import {deploy_job_single} from "../scripts/deploy_job_system.js";
import {deploy_verifier_single} from "../scripts/deploy_verifier.js";

const registry_abi = registry_config.abi;
const job_abi = job_config.abi;
const verifier_abi = verifier_config.abi;
const rpt_abi = rpt_config.abi;
const ethcoin_abi = ethcoin_config.abi;
const erc20_abi = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)"
];
const sepolia_url = process.env.SEPOLIA_RPC_URL;
const provider = new ethers.JsonRpcProvider(sepolia_url);

const registrant_pri_key = process.env.PRIVATE_KEY_REGISTRANT;
const emp_f_pri_key = process.env.PRIVATE_KEY_EMPLOYER_F;
const fre_f_pri_key = process.env.PRIVATE_KEY_FREELANCER_F;
const v_f_pri_key = process.env.PRIVATE_KEY_VERIFIER_F;
const v_a_pri_key = process.env.PRIVATE_KEY_VERIFIER_A;
const v_s_pri_key = process.env.PRIVATE_KEY_VERIFIER_S;
const registrant = new ethers.Wallet(registrant_pri_key, provider);
const e_f = new ethers.Wallet(emp_f_pri_key, provider);
const f_f = new ethers.Wallet(fre_f_pri_key, provider);
const v_f=new ethers.Wallet(v_f_pri_key, provider);
const v_a = new ethers.Wallet(v_a_pri_key, provider);
const v_s = new ethers.Wallet(v_s_pri_key, provider);

const registry_address = process.env.REGISTRY_ADDRESS;
const link_token_address = process.env.LINK_TOKEN;
const registry = new ethers.Contract(registry_address,registry_abi, registrant);
let addresses = await registry.get_system_addresses();
async function approve_tokens(approver, spender, amount) {

    // ReputationToken (RPT)
    const rpt_address = addresses.rpt;
    const rpt = new ethers.Contract(rpt_address, rpt_abi, approver);
    const tx_rpt = await rpt.approve(spender, amount);
    await tx_rpt.wait();
    console.log("RPT approved");

    // EthioCoin
    const ethcoin_address = addresses.ethiocoin;
    const ethcoin = new ethers.Contract(ethcoin_address, ethcoin_abi, approver);
    const tx_eth = await ethcoin.approve(spender, amount);
    await tx_eth.wait();
    console.log("EthioCoin approved");


}

async function approve_link(approver,spender, amount) {

    const link = new ethers.Contract(link_token_address, erc20_abi, approver);
    const tx_link = await link.approve(spender, amount);
    await tx_link.wait();
    console.log("LINK approved for JobManager");
}

async function add_freelancer() {
    const job_system = new ethers.Contract(addresses.job_manager, job_abi, registrant);
    const tx_add_v = await job_system.register_freelancer(f_f.address);
    await tx_add_v.wait();
    console.log("Freelancer added");
}
async function stake() {
    const verifiers = [v_a, v_s, v_f];
    for (const verifier of verifiers) {
        const verifier_system = new ethers.Contract(addresses.verifier, verifier_abi, verifier);
        await approve_tokens(verifier, addresses.verifier, ethers.parseUnits('1000', 18));
        const tx_stake=await verifier_system.stake(ethers.parseUnits('150', 18));
        await tx_stake.wait();
        console.log("Staked");

    }
}

async function add_verifiers() {
    const verifier_system = new ethers.Contract(addresses.verifier, verifier_abi, registrant);
    const verifiers = [v_a.address, v_s.address, v_f.address];
    for (const verifier of verifiers) {
        const tx_add_v = await verifier_system.add_verifier(0, verifier);
        await tx_add_v.wait();
        console.log("Verifier added");
    }
}
async function post_job() {
    const job_id = ethers.zeroPadValue(ethers.toBeHex(12345), 32);
    const amount = ethers.parseUnits("1000", 18);
    const max_duration = 60*60*48;
    const cat = BigInt(0);
    await approve_tokens(e_f, addresses.job_manager, ethers.parseUnits("10000", 18));
    const job_system = new ethers.Contract(addresses.job_manager, job_abi, e_f);
    const tx_post = await job_system.post_job(job_id, amount, max_duration, cat);
    await tx_post.wait();
    console.log("Job posted");
}

async function hire_job() {
    const job_id = ethers.zeroPadValue(ethers.toBeHex(12345), 32);
    const job_system = new ethers.Contract(addresses.job_manager, job_abi, e_f);
    const tx_hire = await job_system.hire(job_id, f_f.address);

}

async function accept_job() {
    await approve_tokens(f_f, addresses.job_manager, ethers.parseUnits("1000", 18));
    const job_id = ethers.zeroPadValue(ethers.toBeHex(12345), 32);
    const job_system = new ethers.Contract(addresses.job_manager, job_abi, f_f);
    const tx_accept = await job_system.accept_job(job_id);
    await tx_accept.wait();
    console.log("Job accepted");
}

async function complete_job() {
    const job_id = ethers.zeroPadValue(ethers.toBeHex(12345), 32);
    const job_system = new ethers.Contract(addresses.job_manager, job_abi, f_f);
    const tx_complete = await job_system.complete_job(job_id);
    await tx_complete.wait();
    console.log("Job completed");
}
async function test_dispute() {
    const job_id = ethers.zeroPadValue(ethers.toBeHex(12345), 32);

    const job_system = new ethers.Contract(addresses.job_manager, job_abi, f_f);
    const job = await job_system.get_job(job_id);
    console.log(job);
    const tx_raise = await job_system.raise_dispute(job_id, true, {gasLimit: 10000000})
    await tx_raise.wait();
    console.log("Dispute raised");


}
async function prepare_verifier_system() {
    await deploy_verifier_single(registry_address, addresses.access_manager);
    addresses = await registry.get_system_addresses();
    await add_verifiers();
    await stake();
}
async function prepare_job_system() {
    await deploy_job_single(registry_address, addresses.access_manager);
    addresses = await registry.get_system_addresses();
    await add_freelancer();
    await post_job();
    await hire_job();
    await accept_job();
    await complete_job();
    await approve_link(f_f, addresses.job_manager, ethers.parseUnits('3', 18));
}
async function get_verifiers() {
    const verifier_system = new ethers.Contract(addresses.verifier, verifier_abi, registrant);
    try {
        for (let i = 0; i < 3; i++) {
            console.log(await verifier_system.leveled_verifiers(0, 1, i));
        }
        // const verifiers = [v_a.address, v_s.address, v_f.address];
        // for (const verifier of verifiers) {
        //     console.log(await verifier_system.verifiers(verifier));
        // }
    } catch (error) {
        console.log(error);
    }
}
async function config_verifier() {
    const verifier_system = new ethers.Contract(addresses.verifier, verifier_abi, registrant);
    const sub_id = await verifier_system.subscription_id();
    const key_hash = await verifier_system.key_hash();
    const callback_gas_limit=500000;
    const request_confirms=3;
    const link_token = await verifier_system.link_token();
    const vrf_wrapper = await verifier_system.vrf_wrapper();

    const tx_config = await verifier_system.set_up_vrf(
      sub_id,  request_confirms, key_hash,callback_gas_limit,link_token, vrf_wrapper
    );
    await tx_config.wait();
}
async function selected_verifiers() {
    const job_id = ethers.zeroPadValue(ethers.toBeHex(12345), 32);
    const verifier_system = new ethers.Contract(addresses.verifier, verifier_abi, registrant);
    const selected_ones=await verifier_system.get_chosen_verifiers(job_id);
    for (const verifier of selected_ones) {
        console.log("verifier: ", verifier);
    }
}
// await prepare_job_system();
await prepare_verifier_system();
// await config_verifier();
// await get_verifiers();
// await test_dispute();
// await selected_verifiers();