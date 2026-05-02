import db from '../models/index.js'

export default async (byte_id) => {
    const id = Buffer.from(byte_id.slice(2), 'hex');
    const [jobs] = await db.query(`
        SELECT j.*, u.f_name AS e_f_name, u.l_name as e_l_name, u.email AS employer_email
        FROM jobs AS j
                 JOIN users AS u ON j.employer_id = u.id
        WHERE j.id = ?`, [id]);
    if (!jobs.length) return null;

    const [bids] = await db.query(`
                SELECT b.*, fu.f_name as fu_f_name, fu.email as freelancer_email, fu.address as freelancer_address
                FROM bids AS b
                LEFT JOIN users as fu on b.user_id=fu.id
                LEFT JOIN freelancers as f on b.user_id=f.user_id
                WHERE b.job_id = ?`,
        [id]);

    const job = jobs[0];
    job.id = byte_id;
    job.bids = bids;
    return job;
}