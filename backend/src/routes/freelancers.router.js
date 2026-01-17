import express from 'express';

import {freelancer_dashboard_controller} from "../controllers/freelancer_dashboard.controller.js";
import {freelancer_profile_controller} from "../controllers/freelancer_profile.controller.js";
import {freelancers_controller} from "../controllers/freelancers.controller.js";

const router = express.Router();

router.get('/dashboard', freelancer_dashboard_controller);
router.get('/profile', freelancer_profile_controller);
router.get('/', freelancers_controller);

export default router;