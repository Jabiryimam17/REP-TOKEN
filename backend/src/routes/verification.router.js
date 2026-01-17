import express from 'express';
import { update_verification_controller } from '../controllers/update_verification.controller.js';
import {unverified_users_controller} from "../controllers/unverified_users.controller.js";
import {verifier_controller} from "../controllers/verifier.controller.js";

const router = express.Router();

router.get('/:id', verifier_controller);
router.post('/', update_verification_controller);
router.get('/', unverified_users_controller);