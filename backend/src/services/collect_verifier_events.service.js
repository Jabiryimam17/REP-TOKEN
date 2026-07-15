import {ethers, getAddress, getBytes} from "ethers";

import verifier_system_interface from "#abis/VerifierSystem.json" with {type: "json"};
const {abi: verifier_system_abi} = verifier_system_interface;
import connect_wallet from "#utils/connect_wallet.util.js";
import db from "#models/index.js";
import addresses from "#utils/system_addresses.util.js"
import {send_selection_email} from "#utils/send_email.util.js";
const { verifier_address} = addresses;
const provider = await connect_wallet();
const MAX_BLOCKS = 5000;

const verifier_system = new ethers.Contract(verifier_address, verifier_system_abi, provider);
function get_hash(b_address) {
    const norm_address = getAddress(b_address);
    return ethers.keccak256(getBytes(norm_address));

}
async function return_last_block() {
    const [rows] = await db.query("SELECT * from configs where id=0");
    return rows[0];
}

async function get_block_ranges(from_block, MAX_BLOCKS) {
    const current_block = await provider.getBlockNumber();
    from_block = (from_block === 0 || from_block === undefined || from_block === null) ? current_block - 10 : from_block;
    return {from_block, to_block: Math.min(current_block, from_block + MAX_BLOCKS)};
}

export async  function listen_disputes() {
    const last_block = await return_last_block();
    const {from_block, to_block}=await get_block_ranges(last_block.detailed_disputes, MAX_BLOCKS);
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    try {
        const events = await verifier_system.queryFilter(
            verifier_system.filters.job_initialized(),
            from_block + 1,
            to_block
        );
        for (const event of events) {
            const {job_id,cat ,stakes}=event.args;
            try {
                await db.query("UPDATE disputes SET disputes.stakes=?, created_at=? WHERE id=?", [stakes, timestamp, job_id]);
            } catch (e) {
                console.error(e);
            }
        }
        await db.query("UPDATE configs SET detailed_disputes=? WHERE id=0", [to_block]);
    } catch (e) {
        console.error(e);
    }

}
export async function listen_dispute_resolves() {

    const last_block = await return_last_block();
    const {from_block, to_block} = await get_block_ranges(last_block.dispute_resolves, MAX_BLOCKS);
    try {
        const events = await verifier_system.queryFilter(
            verifier_system.filters.job_finalized(),
            from_block + 1,
            to_block
        )
        for (const event of events) {
            const {job_id, average_score, resolve_time, slash_cnt, total_reward} = event.args;
            try {
                await db.query("UPDATE disputes set score=?, resolved_time=?, slashed_cnt=?, total_reward=? where job_id=?", [average_score, resolve_time, slash_cnt, total_reward, job_id]);
            } catch (e) {
                console.error(e);
            }

        }
        await db.query("UPDATE configs SET dispute_resolves=? WHERE id=0", [to_block]);
    } catch (e) {
        console.error(e);
    }


}
export async function listen_verifiers_selection() {
    const last_block = await return_last_block();
    const {from_block, to_block} = await get_block_ranges(last_block.verifiers_selection, MAX_BLOCKS);
    try {
        const events = await verifier_system.queryFilter(
            verifier_system.filters.request_fulfilled(),
            from_block + 1,
            to_block
        )
        for (const event of events) {
            const {job_id, submission_deadline, release_deadline} = event.args;
            const verifiers = await verifier_system.get_chosen_verifiers(job_id);
            const [disputes]=await db.query("SELECT * FROM disputes WHERE job_id=?", [job_id]);
            if (disputes.length!==1) continue;
            const dispute=disputes[0];
            await db.query("UPDATE disputes SET submission_deadline=?, disputes.reveal_deadline=? where job_id=?", [submission_deadline, release_deadline, job_id]);
            for (const verifier of verifiers) {
                const hash_address = getAddress(verifier);
                const [users] = await db.query("SELECT * from users where hash_address=? and role=?", [hash_address, "verifier"]);
                for (const user of users) {
                    await send_selection_email(user.email, job_id, verifier);
                    await db.query("INSERT INTO verifier_disputes (dispute_id, verifier_id) VALUES (?, ?)", [dispute.id, user.id]);
                }
            }
        }

        await db.query("UPDATE configs SET verifiers_selection=? WHERE id=0", [to_block]);
    } catch (e) {
        console.error(e);
    }

}
export async function listen_transfer_verifiers_addresses() {
    const last_block=await return_last_block();
    const {from_block, to_block}=await get_block_ranges(last_block.verifier_transfers, MAX_BLOCKS);
    try {
        const events = await verifier_system.queryFilter(
            verifier_system.filters.address_transferred(),
            from_block + 1,
            to_block
        )
        for (const event of events) {
            const {old_address, new_address} = event.args;
            const hash_old = get_hash(old_address);
            const hash_new = get_hash(new_address);
            const [user] = await db.query("SELECT * FROM users where hash_address=?", [hash_old]);
            if (user.length > 0) {
                await db.query("UPDATE users SET hash_address=? where id=?", [hash_new, user[0].id]);

            }
        }
        await db.query("UPDATE configs SET verifier_transfers=? where id=0", [to_block]);

    } catch (e) {
        console.error(e);
    }


}


