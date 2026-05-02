
import jobs_service from "#services/jobs.service.js"
export const jobs_controller=async (req, res)=>{
    try {
        const filters = {
            category: req.query.category,
            search: req.query.search,
            minSalary: req.query.minSalary,
            maxSalary: req.query.maxSalary,
            skills: req.query.skills ? (Array.isArray(req.query.skills) ? req.query.skills : [req.query.skills]) : []
        };
        const jobs=await jobs_service(filters)
        res.status(200).json(jobs)
    }catch(e){
        console.error(e);
        res.status(500).json({error:"Internal server error"})
    }

}
export default jobs_controller;