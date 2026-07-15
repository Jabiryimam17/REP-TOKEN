import db from "#models/index.js";

export default async function roles_assignments() {
    try {
        const [rows] = await db.query("SELECT * FROM contract_roles");
        return rows;
    } catch (error) {
        console.error("Error fetching roles:", error);
        return null;
    }
}
