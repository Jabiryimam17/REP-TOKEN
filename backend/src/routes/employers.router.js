import express from 'express';

import employer_controller from "#controllers/employers.controller.js";
import auth_middleware,{auth_employers_middleware} from "#middlewares/auth.middleware.js";
const router = express.Router();

router.get('/', auth_middleware, auth_employers_middleware, employer_controller);

export default router;