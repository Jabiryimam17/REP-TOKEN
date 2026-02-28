import {ethers, getAddress, getBytes} from "ethers";
import job_system_interface from "#abis/JobPayingSystem.json" with {type: "json"};
const {abi: job_system_abi} = job_system_interface;
import connect_wallet from "#utils/connect_wallet.util.js";
import db from "../models/index.js";
import addresses from "#utils/system_addresses.util.js"
const {job_manager_address} = addresses;

export async function listen_transfer_addresses() {
    const provider = await connect_wallet();
    const job_system = new ethers.Contract(job_manager_address, job_system_abi, provider);
    let [[last_block]] = await db.query("SELECT * FROM configs where id=0");
    if (!last_block) last_block = {freelancer_transfer: 0};
    const prev_block = last_block.freelancer_transfer;
    const current_block = await provider.getBlockNumber();
    const events = await job_system.queryFilter(
        job_system.filters.transfer_address(),
        prev_block,
        current_block
    )
    for (const event of events) {
        const {old_address, new_address} = event.args;
        const norm_old_address = getAddress(old_address);
        const norm_new_address = getAddress(new_address);
        const hash_old =  ethers.keccak256(getBytes(norm_old_address));
        const hash_new = ethers.keccak256(getBytes(norm_new_address));
        const [user] = await db.query("SELECT * FROM users where hash_address=?", [hash_old]);
        if (user.length > 0) {
            await db.query("UPDATE users SET hash_address=? where id=?", [hash_new, user[0].id]);

        }
    }

    await db.query("UPDATE configs SET freelancer_transfer=? where id=0", [current_block + 1]);
}

export async function start_transfer_listener() {
        while (true) {
                try {
                        await listen_transfer_addresses();
                } catch (e) {
                        console.error("Transfer listener error:", e);
                }
                await new Promise((resolve) => setTimeout(resolve, 1000*15*60));// Check every 15 minutes
        }
}

