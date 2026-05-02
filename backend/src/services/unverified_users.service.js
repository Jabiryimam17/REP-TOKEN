import db from "../models/index.js";

export default async () => {
    const [unverified_users]=await db.query("SELECT * FROM users where kyc_v=false");
    return unverified_users;
}