import express from 'express';

import jobs_controller from "#controllers/jobs.controller.js"
import job_controller from "#controllers/job.controller.js";
import post_job_controller from "#controllers/post_job.controller.js";

import bids_controller from "#controllers/bids.controller.js";
import post_bid_controller from "#controllers/post_bid.controller.js";
import auth_middleware, {auth_employers_middleware, auth_freelancers_middleware} from "#middlewares/auth.middleware.js";
const router = express.Router();
router.get('/', jobs_controller);
router.get('/:id', job_controller);
router.post('/', auth_middleware, auth_employers_middleware, post_job_controller);
router.get('/:id/bids', auth_middleware, bids_controller);
router.post('/bid/:id', auth_middleware, auth_freelancers_middleware, post_bid_controller);
export default router;
