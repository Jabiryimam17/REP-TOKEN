
import post_job_service from '#services/postjob.service.js'
export const post_job_controller= async (req, res)=>{
    try {
        const {title, description, company, location, salary}=req.body;
        const job = await post_job_service(title, description, company, location, salary);
        if (post_job_service(job)) res.status(201);
        else res.status(400);
    } catch (e) {
        console.error(e);
        res.status(500).json({error:"Internal server error"})
    }


}
export default post_job_controller;