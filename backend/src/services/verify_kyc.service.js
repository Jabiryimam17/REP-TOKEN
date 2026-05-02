import db from "#models/index.js"

export default async (id)=> {
    await db.query("UPDATE users SET kyc_v=? WHERE id=?", [true, id]);
    return true;
}