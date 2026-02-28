import db from '#models/index.js'

export default async (bid, user_id)=>{
        try {
                const id =Buffer.from(bid.id.slice(2), 'hex');
                const profile_links = JSON.stringify(bid.profile_links);
            const {amount, finishing_days, cover_letter}=bid;
            await db.query("INSERT INTO bids SET ?", {job_id:id, user_id, amount, finishing_days, cover_letter, profile_links, created_at:new Date().toISOString().slice(0, 19).replace("T", " ")})
            return true;
        } catch (error) {
            console.error("Error posting bid:", error);
            return false;
        }

}