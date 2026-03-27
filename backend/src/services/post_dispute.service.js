import db from "#models/index.js"

export async function post_dispute(dispute) {
    await db.query("INSERT INTO disputes (job_id, issuer_id, reason, description) VALUES (?, ?, ?,?)", [dispute.job, dispute.issuer, dispute.reason, dispute.details || '']);
}