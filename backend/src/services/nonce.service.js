import db from "#models/index.js"

import crypto from "crypto"

const nonce_gen =async ()=> {
    const nonce = crypto.randomBytes(16).toString("hex");
    const expiration = new Date(Date.now() + 15 * 60 * 1000)
        .toISOString().slice(0, 19).replace("T", " "); // 15 minutes from now

    const [other] = await db.query("SELECT * FROM nonces where nonce=?", [nonce])
    if (other.length > 0) return nonce_gen()
    await db.query("INSERT INTO nonces (nonce, expires_at) VALUES (?, ?)", [nonce, expiration]);
    return nonce;
}
export default nonce_gen;