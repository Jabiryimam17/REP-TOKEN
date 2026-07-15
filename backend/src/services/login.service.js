import bcrypt from 'bcrypt';
import db from "../models/index.js";

export default async (email, password)=>{
    if (!email || !password) return false;
    const [rows]=await db.query("SELECT * FROM users WHERE email = ?", email);
    const db_user = rows.length > 0 ? rows[0] : null;
    return db_user && bcrypt.compareSync(password,db_user.pass_hash)?{role:db_user.role, id:db_user.id, hash_address: db_user.hash_address}:"";
}
