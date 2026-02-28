import db from "../models/index.js"

export default async (employer_id) => {
    const [jobs] = await db.query(`
        SELECT j.*, u.f_name AS e_f_name, u.l_name as e_l_name, u.email AS employer_email
        FROM jobs AS j
                 JOIN users AS u ON j.employer_id = u.id
        WHERE j.employer_id = ?`, [employer_id]);

    for (let job of jobs) {
        job.id = '0x' + Buffer.from(job.id).toString('hex');
        const [bids] = await db.query(`
            SELECT b.*, fu.f_name as fu_f_name, fu.email as freelancer_email, fu.address as freelancer_address
            FROM bids AS b
                     LEFT JOIN users as fu on b.user_id = fu.id
                     LEFT JOIN freelancers as f on b.user_id = f.user_id
            WHERE b.job_id = ?`,
            [Buffer.from(job.id.slice(2), 'hex')]);
        job.bids = bids;
    }

    return jobs;
}