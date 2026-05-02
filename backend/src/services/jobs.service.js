import db from '../models/index.js';

export default async (filters = {}) => {
    let query = `
        SELECT jobs.*, CONCAT(users.f_name, ' ', users.l_name) as employer_name 
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
        // Convert input from Ether/Token units to Wei if needed, 
        // but assuming the input is already in Wei from UI for now or we should handle scaling.
        // If frontend sends "2000" meaning 2000 ETH, we need to multiply.
        // If frontend sends "2000" meaning 2000 Wei, it works as is.
        // Looking at frontend, it uses ethers.formatUnits(j.salary, 18) to display.
        // So the DB stores Wei. The filter input in URL is likely in "Units" (e.g. 2000).
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
        // Assuming skills is a JSON column. We can use JSON_CONTAINS or simple LIKE if it's simplified.
        // For simplicity and broad compatibility, let's use LIKE if it's stored as JSON string or array
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