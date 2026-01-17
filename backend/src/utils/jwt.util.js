import jwt from "jsonwebtoken";

import { serialize } from "cookie";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const MAX_AGE = 60 * 60 * 60;
const private_key = fs.readFileSync("./keys/private.key", "utf8");
const public_key = fs.readFileSync("./keys/public.key", "utf8");

export function generate_token(user) {
  const token = jwt.sign(user, private_key, {
    algorithm: "RS256",
    expiresIn: MAX_AGE,
  });
  return token;
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
  return res.setHeader("Set-Cookie", cookie);
}
