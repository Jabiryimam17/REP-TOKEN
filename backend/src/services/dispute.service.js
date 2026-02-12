import db from '../models/index.js';

export default (dispute) => {
    if (!dispute.issuer || !dispute.reason) return false;
    db.query('INSERT INTO disputes (job_id,issuer_id, reason, description) VALUES (?, ?, ?,?)', [dispute.job, dispute.issuer, dispute.reason, dispute.details || '']);
    return true;
}