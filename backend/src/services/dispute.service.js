import db from '../models/index.js';

export default async (dispute) => {
    if (!dispute.issuer || !dispute.reason) return false;
    await db.query('INSERT INTO disputes (job_id,issuer_id, reason, description) VALUES (?, ?, ?,?)', [dispute.job, dispute.issuer, dispute.reason, dispute.details || '']);
    return true;
}