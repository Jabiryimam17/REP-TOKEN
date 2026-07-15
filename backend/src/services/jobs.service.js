import db from '../models/index.js';

export default async (filters = {}) => {
    let query = `
        SELECT jobs.*, (users.f_name || ' ' || users.l_name) as employer_name
        FROM jobs
        LEFT JOIN users ON jobs.employer_id = users.id
        WHERE 1=1
    `;
    const params = [];

    if (filters.category && filters.category !== 'All') {
        query += ` AND jobs.category = ?`;
        params.push(filters.category);
    }

    if (filters.search) {
        query += ` AND (jobs.title LIKE ? OR jobs.description LIKE ? OR jobs.company LIKE ?)`;
        const searchVal = `%${filters.search}%`;
        params.push(searchVal, searchVal, searchVal);
    }

    if (filters.minSalary) {
        try {
            const minWei = BigInt(filters.minSalary) * BigInt(10) ** BigInt(18);
            query += ` AND jobs.salary >= ?`;
            params.push(minWei.toString());
        } catch (e) {
            // fallback or ignore invalid bigint
        }
    }

    if (filters.maxSalary) {
        try {
            const maxWei = BigInt(filters.maxSalary) * BigInt(10) ** BigInt(18);
            query += ` AND jobs.salary <= ?`;
            params.push(maxWei.toString());
        } catch (e) {
            // fallback
        }
    }

    if (filters.skills && Array.isArray(filters.skills) && filters.skills.length > 0) {
        filters.skills.forEach(skill => {
            query += ` AND (jobs.skills LIKE ? OR jobs.topics LIKE ?)`;
            const skillVal = `%${skill}%`;
            params.push(skillVal, skillVal);
        });
    }

    query += ` ORDER BY jobs.published_date DESC`;

    const [rows] = await db.query(query, params);
    return rows.map(r => ({
        ...r,
        id: r.id ? ('0x' + Buffer.from(r.id).toString('hex')) : null,
    }));
}
