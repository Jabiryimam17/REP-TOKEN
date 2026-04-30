
import disputes_services from "#services/disputes.service.js"
const disputes_controller = async (req, res) => {
    try {
        const result = await disputes_services();
        res.status(200).json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({error:"Internal server error"})
    }

}

export default disputes_controller;