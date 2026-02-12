
import freelancer_dashboard_service from "#services/freelancer_dashboard.service.js";
const freelancer_dashboard_controller = async (req, res) => {
    try {
        const id = req.user.id;
        const freelancer_dashboard = await freelancer_dashboard_service(id);
        if (!freelancer_dashboard) {
            return res.status(404).json({ error: "Freelancer not found" });
        }
        res.status(200).json(freelancer_dashboard);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }

}

export default freelancer_dashboard_controller;

