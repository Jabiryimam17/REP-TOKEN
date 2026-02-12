import disputes_routes from './disputes.router.js';
import employers_routes from './employers.router.js';
import freelancers_routes from './freelancers.router.js';
import auth_routes from './auth.router.js';
import jobs_routers from "./jobs.router.js";
import verification_routes from './verification.router.js';


export default [
    {path:"/api/disputes", routes:disputes_routes},
    {path:"/api/employers", routes:employers_routes},
    {path:"/api/freelancers", routes:freelancers_routes},
    {path:"/api/auth", routes:auth_routes},
    {path:"/api/jobs", routes:jobs_routers},
    {path:"/api/verification", routes:verification_routes}
]