import unverified_users_service from "#services/unverified_users.service.js"

export default async (req, res) => {
    try {
        const result = await unverified_users_service();
        res.status(200).json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }

}