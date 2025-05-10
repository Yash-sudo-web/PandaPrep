import express from 'express';
import {
  uploadPdfController,
  chatWithPdfController,
  streamChatWithPdfController,
  upload
} from '../controllers/chatWithNotes.controller.js';
import { verifyFirebaseToken } from '../middlewares/auth-verify.middleware.js';

const router = express.Router();

// Route to upload and process a PDF file
router.post('/upload-pdf', verifyFirebaseToken, upload.single('pdf'), uploadPdfController);

// Route to chat with a processed PDF document
router.post('/chat-with-pdf', verifyFirebaseToken, chatWithPdfController);

// Route for streaming chat responses
router.post('/stream-chat-with-pdf', verifyFirebaseToken, streamChatWithPdfController);

export default router;