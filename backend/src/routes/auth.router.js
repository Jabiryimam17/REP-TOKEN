import express from 'express';

import login_controller from "#controllers/login.controller.js";
import signup_controller from "#controllers/signup.controller.js";
import nonce_controller from "#controllers/nonce.controller.js";
import send_code_controller from "#controllers/send_code.controller.js";
import verify_email_controller from "#controllers/verify_email.controller.js";
const router = express.Router();
router.post('/login', login_controller);
router.post('/signup', signup_controller);
router.get('/nonce', nonce_controller)
router.post('/send_code', send_code_controller);
router.post('/verify_email', verify_email_controller);
export default router;