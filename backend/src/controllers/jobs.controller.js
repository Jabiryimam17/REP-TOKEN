
import jobs_service from "#services/jobs.service.js"
export const jobs_controller=async (req, res)=>{
    try {
        const jobs=await jobs_service()
        res.status(200).json(jobs)
    }catch(e){
        console.error(e);
        res.status(500).json({error:"Internal server error"})
    }

}
export default jobs_controller;