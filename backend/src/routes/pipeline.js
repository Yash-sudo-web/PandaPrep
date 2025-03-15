import express from 'express';
import {
  generateNotesController,
  downloadGeneratedNotesController,
} from '../controllers/pipeline.controller.js';

const router = express.Router();

router.post('/generate-notes', generateNotesController);
router.post('/download-notes', downloadGeneratedNotesController);

export default router;
