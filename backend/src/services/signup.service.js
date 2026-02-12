

import db from '../models/index.js';
import bcrypt from 'bcrypt'
import {ethers, verifyMessage} from "ethers";
export  const sign_up = async (user) =>{
    if (!user.email || !user.password || !user.nonce) return false;
    const [other_user]=await db.query("SELECT * FROM users WHERE email = ?", user.email);
    if (other_user.length > 0) return false;
    const [[db_nonce]] = await db.query("SELECT * FROM nonces WHERE nonce = ?", user.nonce);

    if (!db_nonce || db_nonce.used ) return false;
    if (!await verify_authenticity(user.nonce, user.hash, user.signature)) return false;
    await db.query("UPDATE nonces SET used=true WHERE nonce=?", [user.nonce]);
    const [result] = await db.query('INSERT INTO users SET email=?, pass_hash=?, hash_address=?, role=?, f_name=?, l_name=?, profile_picture=?', [user.email, bcrypt.hashSync(user.password, 10), user.hash, user.role, user.f_name, user.l_name, user.profile_picture || null]);
    const user_id = result.insertId;

    if (user.role === 'freelancer') {
        await db.query('INSERT INTO freelancers (user_id, title, category, description) VALUES (?, ?, ?, ?)', [user_id, 'New Freelancer', 'development', 'No description yet.']);
    } else if (user.role === 'verifier') {
        await db.query('INSERT INTO verifiers (user_id) VALUES (?)', [user_id]);
    }

    return true;
}

const verify_authenticity = async (nonce, hash, signature) => {
    if (!nonce || !hash || !signature) return false;
    const calc_address=await verifyMessage(nonce, signature);
    const calc_hash=await ethers.keccak256(calc_address);
    return calc_hash === hash;
}

