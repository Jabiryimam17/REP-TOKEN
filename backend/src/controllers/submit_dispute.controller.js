import disputes_service from "#services/dispute.service.js";

const submit_dispute_controller = async (req, res) => {
    try {
        const { job, issuer, reason, details } = req.body;
        const dispute = { job, issuer, reason, details };
        const result = disputes_service(dispute);
        res.status(200).json({data:result});
    } catch (e) {
        console.error(e);
        res.status(500).json({error:"Internal server error"})
    }

}

export default submit_dispute_controller;