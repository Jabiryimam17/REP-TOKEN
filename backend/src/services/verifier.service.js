import db from "../models/index.js"

export default (id)=> {
    return db.query("SELECT * FROM verifiers as v WHERE id=?", [true])
}