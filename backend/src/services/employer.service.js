import db from "../models/index.js"

export default (employer_id)=> {
    return db.query("SELECT * FROM users u JOIN contacts c on u.id=c.user_id JOIN jobs as j on u.id=j.employer_id JOIN addresses as a on a.user_id=u.id WHERE u.id = ?", [employer_id])
}