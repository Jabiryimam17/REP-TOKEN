import db from "../models/index.js"

export default async (filters = {}) => {
    const {
        category,
        skills,
        min_wage,
        max_wage,
        search,
        page = 1,
        limit = 10
    } = filters;

    let whereClauses = [];
    let values = [];

    if (category && category !== 'All Categories') {
        whereClauses.push("f.category = ?");
        values.push(category);
    }

    if (min_wage) {
        whereClauses.push("f.min_wage >= ?");
        values.push(Number(min_wage));
    }

    if (max_wage) {
        whereClauses.push("f.min_wage <= ?");
        values.push(Number(max_wage));
    }

    if (skills) {
        // Handle both JSON array and comma-separated string
        let skillsList = [];
        if (typeof skills === 'string') {
            try {
                const parsed = JSON.parse(skills);
                skillsList = Array.isArray(parsed) ? parsed : skills.split(',').map(s => s.trim());
            } catch (e) {
                skillsList = skills.split(',').map(s => s.trim());
            }
        } else if (Array.isArray(skills)) {
            skillsList = skills;
        }

        skillsList.forEach(skill => {
            whereClauses.push("f.skills LIKE ?");
            values.push(`%${skill}%`);
        });
    }

    if (search) {
        whereClauses.push("(u.f_name LIKE ? OR u.l_name LIKE ? OR f.title LIKE ? OR f.description LIKE ?)");
        const searchVal = `%${search}%`;
        values.push(searchVal, searchVal, searchVal, searchVal);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const offset = (page - 1) * limit;

    const query = `
        SELECT
            u.id, u.f_name, u.l_name, u.profile_picture, u.location,
            f.title, f.category, f.description, f.min_wage, f.skills, f.qualifications
        FROM users u
        JOIN freelancers f ON u.id = f.user_id
        ${whereSql}
        LIMIT ? OFFSET ?
    `;

    const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        JOIN freelancers f ON u.id = f.user_id
        ${whereSql}
    `;

    const [rows] = await db.query(query, [...values, Number(limit), Number(offset)]);
    const [countRows] = await db.query(countQuery, values);

    return {
        freelancers: rows || [],
        total: (countRows && countRows[0] && countRows[0].total) || 0,
        page: Number(page),
        limit: Number(limit)
    };
}
