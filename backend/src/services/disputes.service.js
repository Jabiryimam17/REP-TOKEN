import db from "../models/index.js";
import {ethers} from "ethers";
import verifier_system_interface from "#abis/VerifierSystem.json" with {type: "json"};
import connect_wallet from "#utils/connect_wallet.util.js";
import addresses from "#utils/system_addresses.util.js";
const {verifier_address} = addresses;
const {abi: verifier_system_abi} = verifier_system_interface;

export default async ()=>{
    const [disputes] = await db.query(`
        SELECT d.*, j.title as job_title, j.salary as job_amount, u.email as issuer_email
        FROM disputes d
        JOIN jobs j ON d.job_id = j.id
        JOIN users u ON d.issuer_id = u.id
    `);

    const provider = await connect_wallet();
    const verifier_system = new ethers.Contract(verifier_address, verifier_system_abi, provider);

    const enriched_disputes = await Promise.all(disputes.map(async (d) => {
        const job_id_hex = '0x' + Buffer.from(d.job_id).toString('hex');
        try {
            const job_data = await verifier_system.get_job(job_id_hex);
            return {
                ...d,
                job_id: job_id_hex,
                status: Number(job_data.dispute_status),
                open_for_dispute: job_data.open_for_dispute,
                category: job_data.category,
                level: job_data.level,
                chosen_verifiers_count: job_data.chosen_verifiers.length
            };
        } catch (e) {
            console.error(`Error fetching contract data for job ${job_id_hex}:`, e);
            return {
                ...d,
                job_id: job_id_hex,
                status: -1 // Unknown
            };
        }
    }));

    return enriched_disputes;
}
