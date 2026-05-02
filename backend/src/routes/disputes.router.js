import express from "express";
import disputes_controller from "#controllers/disputes.controller.js";
import submit_dispute_controller from "#controllers/submit_dispute.controller.js";
import auth_middleware, {auth_verifiers_middleware} from "#middlewares/auth.middleware.js";
import post_dispute_controller from "#controllers/post_dispute.controller.js";
import {dispute_details_controller} from "#controllers/verifier.controller.js";
const router=express.Router();

router.get("/",disputes_controller);
router.get("/:job_id", dispute_details_controller);
router.post("/", auth_middleware, auth_verifiers_middleware,submit_dispute_controller);
router.post("/post", auth_middleware,post_dispute_controller);
export default router;