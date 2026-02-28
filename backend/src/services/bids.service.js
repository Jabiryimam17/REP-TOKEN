import db from '#models/index.js'

export  default async (id)=>{

    return [await db.query("SELECT * FROM bids as  b JOIN freelancers as f on f.user_id=b.user_id WHERE b.job_id=?", [id])];
}