import jwt from "jsonwebtoken";

import {serialize} from "cookie";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config({ path: "../../.env" });



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_AGE = 60 * 60;

const private_key = fs.readFileSync(
    path.join(__dirname, "../../src/config/keys/private.pem"),
    "utf8"
);

const public_key = fs.readFileSync(
    path.join(__dirname, "../../src/config/keys/public.pem"),
    "utf8"
);

export function generate_token(user) {
  const pass_phrase = process.env.PRIVATE_KEY_PASSPHRASE;
  const payload = {sub: user.id, role: user.role, hash_address: user.hash_address};
  return jwt.sign(payload, {
    key:private_key,
    passphrase: pass_phrase,
  }, {
    algorithm: "RS256",
    expiresIn: MAX_AGE,
  });
}
export function verify_token(token) {
  try {
    return jwt.verify(token, public_key, {
      algorithms: ["RS256"],
    });
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export function set_token_cookie(res, token) {
  const cookie = serialize("token", token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
  res.setHeader("Set-Cookie", cookie);
}

export function remove_token_cookie(res) {
  const cookie = serialize("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: -1,
    expires: new Date(0),
    path: "/",
  });
  res.setHeader("Set-Cookie", cookie);
}
