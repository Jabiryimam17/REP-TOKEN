import post_job_service from '#services/post_job.service.js'

export const post_job_controller = async (req, res) => {
    try {
        const job = req.body;
        if (await post_job_service(job, req.user.id)) {
            res.status(201);
            res.send({message: "Job posted successfully"})
        } else {
            res.status(400);
            res.send({message: "Error posting job"})
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({error: "Internal server error"})
        res.send({message: "Error posting job"})
    }


}
export default post_job_controller;