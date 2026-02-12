import db from '../models/index.js'

export default async (id) => {
    // 1. Fetch main freelancer & user info
    const [user_rows] = await db.query(`
        SELECT u.id, u.f_name, u.l_name, u.email, u.location, u.profile_picture, u.bio, u.created_at as joined_data,
               f.title, f.category, f.description, f.min_wage, f.skills, f.qualifications
        FROM users u
        LEFT JOIN freelancers f ON f.user_id = u.id
        WHERE u.id = ?
    `, [id]);

    if (!user_rows || user_rows.length === 0) return null;
    const user = user_rows[0];

    // Parse JSON fields
    if (user.skills && typeof user.skills === 'string') {
        try { user.skills = JSON.parse(user.skills); } catch(e) { user.skills = []; }
    }
    if (user.qualifications && typeof user.qualifications === 'string') {
        try { user.qualifications = JSON.parse(user.qualifications); } catch(e) { user.qualifications = []; }
    }

    // 2. Fetch related data
    const [certifications] = await db.query("SELECT title as name, issuer, year FROM certifications WHERE user_id = ?", [id]);
    const [contacts] = await db.query("SELECT github, website, twitter, instagram, telegram, whatsapp, linkedin FROM contacts WHERE user_id = ?", [id]);
    const [education] = await db.query("SELECT title as degree, institution as school, start_year as startYear, end_year as endYear FROM education_levels WHERE user_id = ?", [id]);
    
    // 3. Fetch reviews
    const [reviews] = await db.query(`
        SELECT r.id, r.comment as text, r.rating, r.created_at as date,
               u.f_name as author_f_name, u.l_name as author_l_name
        FROM reviews r
        JOIN users u ON r.reviewer_id = u.id
        WHERE r.user_id = ?
    `, [id]);



    const stats = { totalJobs: 0, successfulJobs: 0 };

    return {
        profile: {
            ...user,
            name: `${user.f_name} ${user.l_name}`,
            totalJobs: stats.totalJobs,
            successfulJobs: stats.successfulJobs,
            rating: 4.8, // Placeholder until reviews average is implemented
            joinedDate: new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        },
        certifications,
        contacts: contacts[0] || {},
        education: education.map(edu => ({
            ...edu,
            year: `${edu.startYear} - ${edu.endYear || 'Present'}`
        })),
        reviews: reviews.map(r => ({
            ...r,
            author: `${r.f_name} ${r.l_name}`
        }))
    };
}