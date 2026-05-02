import express from 'express';

import login_controller from "#controllers/login.controller.js";
import signup_controller from "#controllers/signup.controller.js";
import nonce_controller from "#controllers/nonce.controller.js";
import send_code_controller from "#controllers/send_code.controller.js";
import verify_email_controller from "#controllers/verify_email.controller.js";
import logout_controller from "#controllers/logout.controller.js";
import forget_password_controller from "#controllers/forget_password.controller.js";
import reset_password_controller from "#controllers/reset_password.controller.js";
import roles_assignments_controller from "#controllers/roles.controller.js";
import auth_middleware, {auth_admin_middleware} from "#middlewares/auth.middleware.js";
import upload from "#middlewares/upload.middleware.js";

const router = express.Router();
router.post('/login', login_controller);
router.post('/signup', upload.single('profile_picture'), signup_controller);
router.get('/nonce', nonce_controller)
router.post('/send_code', send_code_controller);
router.post('/verify_email', verify_email_controller);
router.post('/logout', auth_middleware,logout_controller);
router.post('/forget_password', forget_password_controller);
router.post('/reset_password', reset_password_controller);
router.get('/roles_assignments', auth_middleware, auth_admin_middleware, roles_assignments_controller);
export default router;