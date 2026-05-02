import express from 'express';
import verify_controller from '#controllers/verify_kyc.controller.js';
import unverified_users_controller from "#controllers/unverified_users.controller.js";
import verifier_controller from "#controllers/verifier.controller.js";
import auth_middleware,{auth_admin_middleware} from "#middlewares/auth.middleware.js";

const router = express.Router();

router.get('/:id', verifier_controller);
router.post('/:id', auth_middleware, auth_admin_middleware, verify_controller);
router.get('/', unverified_users_controller);
export default router;