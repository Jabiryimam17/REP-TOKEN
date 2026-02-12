

import verifier_services from "#services/verifier.service.js";

const verifier_controller = async (req, res) => {
    try {
        const id = req.params.id;
        const verifier = await verifier_services(id); // await async service
        res.status(200).json(verifier);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export default verifier_controller;