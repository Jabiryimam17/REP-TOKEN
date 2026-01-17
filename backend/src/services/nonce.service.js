import db from "../db/index"

import crypto from "crypto"

export default ()=> {
    const nonce = crypto.randomBytes(16).toString("hex");
    const expiration = Date.now() + 15 * 60 * 1000; // 15 minutes from now
    const other = db.query("SELECT * FROM nonces where nonce=?", [nonce])
    if (other.length > 0) return this();
    db.query("INSERT INTO nonces (nonce, expires_at) VALUES (?, ?)", [nonce, expiration]);
    return nonce;
}