import db from '../models/index.js'

export default (id)=>{
    return db.query("SELECT * FROM jobs as j JOIN users as u on j.employer_id=u.id JOIN bids as b on j.id = b.job_id WHERE j.id=?", [id])
}