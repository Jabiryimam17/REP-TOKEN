import freelancer_profile_service from "#services/freelancer_profile.service.js"
const freelancer_profile_controller = async (req, res) => {
    try {
        const id = req.params.id;
        const freelancer_profile = await freelancer_profile_service(id);
        if (!freelancer_profile) {
            return res.status(404).json({ error: "Freelancer not found" });
        }
        res.status(200).json(freelancer_profile);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }


}

export default freelancer_profile_controller;