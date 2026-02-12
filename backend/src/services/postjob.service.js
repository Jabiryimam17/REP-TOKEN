import db from "../models/index.js"

export default (job)=> {
    db.query("INSERT INTO jobs SET ?", job);
    return true;
}