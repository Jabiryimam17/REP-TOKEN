import db from "#models/index.js"
import bcrypt from 'bcrypt'

const reset_password = async (email, code, new_password) => {
    const [[user]] = await db.query("SELECT * FROM users WHERE email=?", [email]);
    if (!user) return { success: false, message: "User not found" };

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    if (user.code !== code || user.expiry_at < now) {
        return { success: false, message: "Invalid or expired code" };
    }

    const hashed_password = bcrypt.hashSync(new_password, 10);
    await db.query("UPDATE users SET pass_hash=?, code=NULL, expiry_at=NULL WHERE email=?", [hashed_password, email]);

    return { success: true, message: "Password reset successful" };
}

export default reset_password;
