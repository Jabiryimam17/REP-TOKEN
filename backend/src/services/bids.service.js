import db from '#models/index.js'

export  default async (id)=>{
    const [rows] = await db.query("SELECT b.*, u.f_name, u.l_name FROM bids as b JOIN users as u ON u.id = b.user_id WHERE b.job_id=?", [id]);
    return rows;
}
