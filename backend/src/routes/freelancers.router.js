import express from 'express';

import freelancer_dashboard_controller from "../controllers/freelancer_dashboard.controller.js";
import {freelancer_update_controller} from "#controllers/freelancer_update.controller.js";
import freelancer_profile_controller from "../controllers/freelancer_profile.controller.js";
import freelancers_controller from "../controllers/freelancers.controller.js";
import auth_middleware,{auth_freelancers_middleware} from "#middlewares/auth.middleware.js";
const router = express.Router();

router.get('/dashboard/', auth_middleware, auth_freelancers_middleware, freelancer_dashboard_controller);
router.put('/update', auth_middleware, auth_freelancers_middleware,freelancer_update_controller);
router.get('/profile/:id', freelancer_profile_controller);
router.get('/', freelancers_controller);

export default router;