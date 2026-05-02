import bids_service from "#services/bids.service.js"
export const bids_controller = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await bids_service(id);
        if (result) {
            res.status(200).json({ message: "Bids fetched successfully", data: result });
        } else {
            res.status(404).json({ message: "No bids found" });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }

}
export default bids_controller;