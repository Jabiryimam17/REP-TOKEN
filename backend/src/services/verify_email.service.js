import db from "#models/index.js"

export default async (email, code) => {
    const [[user]]=await db.query("SELECT * FROM users WHERE email=? AND code=? AND email_v=false", [email, code]); // still configure exipiry at
    if (!user) return false;
    await db.query("UPDATE users SET email_v=? WHERE email=?", [true, email]);
    return true;

}