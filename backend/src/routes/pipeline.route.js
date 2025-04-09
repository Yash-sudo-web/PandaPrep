import express from 'express';
import {
  generateNotesController,
} from '../controllers/pipeline.controller.js';
import { verifyFirebaseToken } from '../middlewares/auth-verify.middleware.js';

const router = express.Router();

router.post('/generate-notes', verifyFirebaseToken, generateNotesController);

export default router;
