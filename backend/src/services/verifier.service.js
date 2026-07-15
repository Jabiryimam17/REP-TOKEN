import db from "../models/index.js"
import {ethers, getAddress, getBytes} from "ethers";
import verifier_system_interface from "#abis/VerifierSystem.json" with {type: "json"};
import connect_wallet from "#utils/connect_wallet.util.js";
import addresses from "#utils/system_addresses.util.js";
const {verifier_address} = addresses;
const {abi: verifier_system_abi} = verifier_system_interface;

export const get_verifier_info = async (id) => {
    const [verifier] = await db.query(`
        SELECT u.id, u.email, u.address, u.hash_address, v.user_id
        FROM users u
        JOIN verifiers v ON u.id = v.user_id
        WHERE u.id = ? OR u.hash_address = ?
    `, [id, id]);

    if (verifier.length === 0) return null;

    const [jobs] = await db.query(`
        SELECT j.*
        FROM disputes j
        JOIN verifier_disputes vd ON j.id = vd.dispute_id
        WHERE vd.verifier_id = ?
    `, [verifier[0].id]);

    return {
        ...verifier[0],
        jobs: jobs.map(j => ({
            ...j,
            id: j.id ? ('0x' + Buffer.from(j.id).toString('hex')) : null,
        }))
    }
}

export const get_dispute_details = async (job_id) => {
    // 1. Fetch from database (disputes table)
    const [dispute_rows] = await db.query("SELECT * FROM disputes WHERE job_id = ?", [job_id]);
    if (dispute_rows.length === 0) return null;
    const db_dispute = dispute_rows[0];

    // 2. Fetch from contract
    const provider = await connect_wallet();
    const verifier_system = new ethers.Contract(verifier_address, verifier_system_abi, provider);

    const job_data = await verifier_system.get_job(job_id);
    const scores = await verifier_system.get_scores(job_id);

    // Map scores to verifiers
    const verifier_scores = {};
    job_data.chosen_verifiers.forEach((v_addr, index) => {
        verifier_scores[v_addr] = scores[index].toString();
    });

    return {
        ...db_dispute,
        job_id: job_id,
        contract_data: {
            open_for_dispute: job_data.open_for_dispute,
            submission_deadline: job_data.submission_deadline.toString(),
            release_deadline: job_data.release_deadline.toString(),
            category: job_data.category,
            stakes: job_data.stakes.toString(),
            client_stake: job_data.client_stake.toString(),
            freelancer_stake: job_data.freelancer_stake.toString(),
            level: job_data.level,
            lock_amount: job_data.lock_amount.toString(),
            dispute_status: Number(job_data.dispute_status),
            chosen_verifiers: job_data.chosen_verifiers,
            total_revealed: scores.filter(s => Number(s) > 0).length,
            total_submitted: job_data.chosen_verifiers.length,
            scores: scores.map(s => s.toString())
        }
    };
}

export default get_verifier_info;
