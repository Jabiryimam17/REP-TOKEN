import {ethers, getAddress, getBytes} from "ethers";
import job_system_interface from "#abis/JobPayingSystem.json" with {type: "json"};

const {abi: job_system_abi} = job_system_interface;
import db from "#models/index.js";
import connect_wallet from "#utils/connect_wallet.util.js";
import addresses from "#utils/system_addresses.util.js"
import {send_job_notifications} from "#utils/send_email.util.js";
//TODO: adjust timestamp or check timestamp
const {job_manager_address} = addresses;
const provider = await connect_wallet();
const job_system = new ethers.Contract(job_manager_address, job_system_abi, provider);
const MAX_BLOCKS = 5000;
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

async function listen_job_posts() {
    const last_block = await return_last_block();
    const {from_block, to_block} = await get_block_ranges(last_block.job_posts, MAX_BLOCKS);
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    try {
        const events = await job_system.queryFilter(
            job_system.filters.job_posted(),
            from_block + 1,
            to_block
        )
        for (const event of events) {
            const {job_id, amount} = event.args;
            const [jobs] = await db.query("SELECT * FROM jobs WHERE id=?", [job_id]);
            if (jobs.length > 0) {
                await db.query("UPDATE jobs SET salary=?, state=? WHERE id=?", [amount, 'OPEN', job_id]);
            }
        }

        await db.query("UPDATE configs SET job_posts=? WHERE id=0", [to_block]);
    } catch (e) {
        console.error(e);
    }

}

export async function listen_pendings() {
    const last_block = await return_last_block();
    const {from_block, to_block} = await get_block_ranges(last_block.pendings, MAX_BLOCKS);
    try {
        const events = await job_system.queryFilter(
            job_system.filters.job_hired(),
            from_block + 1,
            to_block
        )
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        for (const event of events) {
            const {job_id, freelancer} = event.args;
            const hash_address = get_hash(freelancer);
            const [users] = await db.query("SELECT * FROM users where hash_address=?", [hash_address]);
            if (users.length > 0) {

                const [res] = await db.query("UPDATE jobs SET jobs.state=?, jobs.freelancer_id=?, last_change=? where id=? AND (last_change < ? OR last_change IS NULL)", ["PENDING", users[0].id, timestamp, job_id, timestamp]);
                if (res.affectedRows > 0) {
                    await send_job_notifications(users[0].email, "PENDING");
                }
            }
        }
        await db.query("UPDATE configs SET pendings=? where id=0", [to_block]);
    } catch (e) {
        console.error(e);
    }


}

export async function listen_job_acceptances() {
    const last_block = await return_last_block();
    const {from_block, to_block} = await get_block_ranges(last_block.job_acceptances, MAX_BLOCKS);
    try {
        const events = await job_system.queryFilter(
            job_system.filters.job_accepted(),
            from_block + 1,
            to_block
        )
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        for (const event of events) {
            const {job_id, freelancer} = event.args;
            const hash_address = get_hash(freelancer);
            const [jobs] = await db.query("SELECT * FROM jobs WHERE jobs.id=?", [job_id]);

            if (jobs.length > 0) {
                const [freelancers] = await db.query("SELECT * FROM users WHERE users.hash_address=?", [hash_address]);
                if (freelancers.length > 0) {
                    const [res] = await db.query("UPDATE jobs SET jobs.state=?, jobs.freelancer_id=?, last_change=? where id=? AND (last_change < ? OR last_change IS NULL)", ["ACCEPTED", freelancers[0].id, timestamp, job_id, timestamp]);
                    if (res.affectedRows > 0) {
                        await send_job_notifications(freelancers[0].email, "ACCEPTED");
                    }
                }
            }
        }
        await db.query("UPDATE configs SET job_acceptances=? where id=0", [to_block]);
    } catch (e) {
        console.error(e);
    }

}

export async function listen_job_unhired_cancels() {
    const last_block = await return_last_block();
    const {from_block, to_block} = await get_block_ranges(last_block.job_unhired_cancels, MAX_BLOCKS);
    try {
        const events = await job_system.queryFilter(
            job_system.filters.job_cancel_unhired(),
            from_block + 1,
            to_block
        )
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        for (const event of events) {
            const {job_id} = event.args;

            const [jobs] = await db.query("SELECT * FROM jobs JOIN users on jobs.freelancer_id = users.id  WHERE jobs.id=?", [job_id]);
            if (jobs.length > 0) {
                const [res] = await db.query("UPDATE jobs SET state=?, last_change=? where id=? AND (last_change < ? OR last_change IS NULL)", ["CANCELLED", timestamp, job_id, timestamp]);
                if (res.affectedRows > 0) {
                    await send_job_notifications(jobs[0].email, "CANCELLED");
                }
            }
        }
        await db.query("UPDATE configs SET job_unhired_cancels=? where id=0", [to_block]);
    } catch (e) {
        console.error(e);
    }

}

export async function listen_job_expiration_cancels() {
    const last_block = await return_last_block();
    const {from_block, to_block} = await get_block_ranges(last_block.job_expire_cancels, MAX_BLOCKS);
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    try {
        const events = await job_system.queryFilter(
            job_system.filters.job_cancel_expired(),
            from_block + 1,
            to_block
        )
        for (const event of events) {
            const {job_id} = event.args;
            const [jobs] = await db.query("SELECT * FROM jobs JOIN users on jobs.freelancer_id = users.id where jobs.id=?", [job_id]);
            if (jobs.length > 0) {
                const [res] = await db.query("UPDATE jobs SET state=?, last_change=? where id=? AND (last_change < ? OR last_change IS NULL)", ["OPEN", timestamp, job_id, timestamp]);
                if (res.affectedRows > 0) {
                    await send_job_notifications(jobs[0].email, "CANCELLED");
                }
            }
        }
        await db.query("UPDATE configs SET job_expire_cancels=? where id=0", [to_block]);
    } catch (e) {
        console.error(e);
    }
}

export async function listen_job_disputes() {
    const last_block = await return_last_block();
    const {from_block, to_block} = await get_block_ranges(last_block.disputes, MAX_BLOCKS);
    try {
        const events = await job_system.queryFilter(
            job_system.filters.job_disputed(),
            from_block + 1,
            to_block
        )
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        for (const event of events) {
            const {job_id} = event.args;
            const [jobs] = await db.query("SELECT * FROM jobs JOIN users on jobs.freelancer_id = users.id  WHERE jobs.id=?", [job_id]);
            if (jobs.length > 0) {
                const [res] = await db.query("UPDATE jobs SET state=?, last_change=? where id=? AND (last_change < ? OR last_change IS NULL)", ["DISPUTED", timestamp, job_id, timestamp]);
                if (res.affectedRows > 0) {
                    await send_job_notifications(jobs[0].email, "DISPUTED");
                    const [[employer]] = await db.query("SELECT * FROM jobs JOIN users on jobs.employer_id = users.id  WHERE jobs.id=?", [job_id]);
                    await send_job_notifications(employer.email, "DISPUTED");
                }
            }
        }
        await db.query("UPDATE configs SET disputes=? where id=0", [to_block]);
    } catch (e) {
        console.error(e);
    }
}

export async function listen_job_completes() {
    const last_block = await return_last_block();
    const {from_block, to_block} = await get_block_ranges(last_block.completes, MAX_BLOCKS);
    try {
        const events = await job_system.queryFilter(
            job_system.filters.job_completed(),
            from_block + 1,
            to_block
        )
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        for (const event of events) {
            const {job_id} = event.args;
            const [jobs] = await db.query("SELECT * FROM jobs JOIN users on jobs.employer_id = users.id  WHERE jobs.id=?", [job_id]);
            if (jobs.length > 0) {
                const [res] = await db.query("UPDATE jobs SET state=?, last_change=? where id=? AND (last_change < ? OR last_change IS NULL)", ["COMPLETED", timestamp, job_id, timestamp]);
                if (res.affectedRows > 0) {
                    await send_job_notifications(jobs[0].email, "COMPLETED");
                }
            }
        }
        await db.query("UPDATE configs SET completes=? where id=0", [to_block]);
    } catch (e) {
        console.error(e);
    }
}

export async function listen_job_closure() {
    const last_block = await return_last_block();
    const {from_block, to_block} = await get_block_ranges(last_block.closes, MAX_BLOCKS);
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    try {
        const events = await job_system.queryFilter(
            job_system.filters.job_closed(),
            from_block + 1,
            to_block
        )
        for (const event of events) {
            const {job_id} = event.args;
            const [jobs] = await db.query("SELECT * FROM jobs JOIN users on jobs.employer_id = users.id  WHERE jobs.id=?", [job_id]);
            if (jobs.length > 0) {
                const [res] = await db.query("UPDATE jobs SET state=?, last_change=? where id=? AND (last_change < ? OR last_change IS NULL)", ["CLOSED", timestamp, job_id, timestamp]);
                if (res.affectedRows > 0) {
                    await send_job_notifications(jobs[0].email, "CLOSED");
                }
            }
        }
        await db.query("UPDATE configs SET closes=? where id=0", [to_block]);
    } catch (e) {
        console.error(e);
    }
}

export async function listen_transfer_freelancer_addresses() {
    const last_block = await return_last_block();
    const {from_block, to_block} = await get_block_ranges(last_block.freelancer_transfer, MAX_BLOCKS);

    try {
        const events = await job_system.queryFilter(
            job_system.filters.transfer_address(),
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

        await db.query("UPDATE configs SET freelancer_transfer=? where id=0", [to_block]);
    } catch (e) {
        console.error(e);
    }


}

export {listen_job_posts};
