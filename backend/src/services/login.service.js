import bcrypt from 'bcrypt';
import db from "../models/index.js";

export default async (email, password)=>{
    if (!email || !password) return false;
    const [[db_user]]=await db.query("SELECT * FROM users WHERE email = ?", email);
    return db_user && bcrypt.compareSync(password,db_user.pass_hash)?{role:db_user.role, id:db_user.id}:"";
}
