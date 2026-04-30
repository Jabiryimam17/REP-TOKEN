

import {get_verifier_info, get_dispute_details} from "#services/verifier.service.js";

const verifier_controller = async (req, res) => {
    try {
        const id = req.params.id;
        const verifier = await get_verifier_info(id); // await async service
        res.status(200).json(verifier);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const dispute_details_controller = async (req, res) => {
    try {
        const job_id = req.params.job_id;
        const dispute = await get_dispute_details(job_id);
        if (!dispute) return res.status(404).json({ error: "Dispute not found" });
        res.status(200).json(dispute);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
}

export default verifier_controller;