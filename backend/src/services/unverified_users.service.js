import db from "../db/index.js";
export default () => db.query("SELECT * FROM users where verified=0");