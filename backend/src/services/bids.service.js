import {db} from '../db/index.js'

export default (id)=>{
    return db.query("SELECT * FROM bids as  b JOIN freelancers as f on f.user_id=b.user_id WHERE b.job_id=?", [id])
}