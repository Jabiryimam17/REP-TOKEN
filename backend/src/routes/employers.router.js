import express from 'express';

import employer_controller from "#controllers/employers.controller.js";

const router = express.Router();

router.get('/', employer_controller);

export default router;