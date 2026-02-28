import db from "#models/index.js"

export default async (id) => {
    const [user] = await db.query(`
        SELECT u.id, u.f_name, u.l_name, u.email, u.location, u.profile_picture, u.bio,
               f.title, f.category, f.description, f.min_wage, f.skills, f.qualifications
        FROM users u
        LEFT JOIN freelancers f ON f.user_id = u.id
        WHERE u.id = ?
    `, [id]);

    if (!user || user.length === 0) return null;
    const profile = user[0];
    
    // Parse JSON fields
    if (profile.skills && typeof profile.skills === 'string') {
        try { profile.skills = JSON.parse(profile.skills); } catch(e) { profile.skills = []; }
    }
    if (profile.qualifications && typeof profile.qualifications === 'string') {
        try { profile.qualifications = JSON.parse(profile.qualifications); } catch(e) { profile.qualifications = []; }
    }

    const [jobs] = await db.query(`
        SELECT j.*, u.f_name as employer_f_name, u.l_name as employer_l_name, u.email as employer_email
        FROM jobs j
        JOIN users u ON j.employer_id = u.id
        WHERE j.freelancer_id = ? 
           OR j.id IN (SELECT job_id FROM bids WHERE user_id = ?)
    `, [id, id]);

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
    const [certifications] = await db.query("SELECT * FROM certifications WHERE user_id = ?", [id]);
    const [contacts] = await db.query("SELECT github, website, twitter, instagram, telegram, whatsapp, linkedin FROM contacts WHERE user_id = ?", [id]);

    const [education] = await db.query("SELECT title as degree, institution as school, start_year as startYear, end_year as endYear FROM education_levels WHERE user_id = ?", [id]);

    return {
        profile: profile,
        jobs: jobs,
        certifications: certifications,
        contacts: contacts[0] || {},
        education: education
    };
}