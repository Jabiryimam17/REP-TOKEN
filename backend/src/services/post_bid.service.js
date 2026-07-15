import db from '#models/index.js'

export default async (bid, user_id)=>{
        try {
                const id =Buffer.from(bid.id.slice(2), 'hex');
                const profile_links = JSON.stringify(bid.profile_links);
            const {amount, finishing_days, cover_letter, freelancer_address}=bid;

            // Check if bid already exists
            const [existing] = await db.query("SELECT id FROM bids WHERE job_id = ? AND user_id = ?", [id, user_id]);

            if (existing.length > 0) {
                // Update existing bid
                await db.query("UPDATE bids SET amount=?, finishing_days=?, cover_letter=?, profile_links=?, freelancer_address=? WHERE id = ?", [amount, finishing_days, cover_letter, profile_links, freelancer_address, existing[0].id]);
            } else {
                // Insert new bid
                const created_at=new Date().toISOString().slice(0, 19).replace("T", " ");
                await db.query("INSERT INTO bids (job_id, user_id, amount, finishing_days, cover_letter, profile_links, freelancer_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id, user_id, amount, finishing_days, cover_letter, profile_links, freelancer_address, created_at]);
            }
            return true;
        } catch (error) {
            console.error("Error posting bid:", error);
            return false;
        }

}
