import db from '../models/index.js';

export default async ()=>{
    const [rows] = await db.query("SELECT * FROM jobs");
    return rows.map(r => ({
        ...r,
        id: r.id ? ('0x' + Buffer.from(r.id).toString('hex')) : null,
    }));
}