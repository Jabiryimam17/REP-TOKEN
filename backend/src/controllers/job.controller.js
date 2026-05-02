import job_service from '#services/job.service.js';
export const job_controller = async (req, res) => {
    try {
        const id = req.params.id;
        const job = await job_service(id);
        res.status(200).json(job);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }

}
export default job_controller;