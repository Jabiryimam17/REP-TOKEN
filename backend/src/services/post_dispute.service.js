import db from "#models/index.js"

export async function post_disputeService(dispute) {
    try {
        const id = Buffer.from(dispute.job.slice(2), 'hex');
        await db.query("INSERT INTO disputes (job_id, reason, description) VALUES (?, ?, ?)", [id, dispute.reason, dispute.details || '']);
        return true;
    } catch (error) {
        console.error("Error posting dispute:", error);
        return false;
    }

}
