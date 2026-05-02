import db from "#models/index.js"
import crypto from "crypto"
import { send_password_reset_email } from "#utils/send_email.util.js"

const forget_password = async (email) => {
    const [[user]] = await db.query("SELECT * FROM users WHERE email=?", [email])
    if (!user) return false;

    const code = generate_secure_code();
    const expiry_at = new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
    
    await db.query("UPDATE users SET code=?, expiry_at=? WHERE email=?", [code, expiry_at, email]);
    await send_password_reset_email(email, code);
    return true;
}

function generate_secure_code(length = 6) {
    return crypto.randomBytes(length)
        .toString('base64')       // encode in base64
        .replace(/[^a-zA-Z0-9]/g, '') // remove special chars
        .slice(0, length);        // ensure fixed length
}

export default forget_password;
