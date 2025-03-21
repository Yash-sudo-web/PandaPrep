import express from 'express';
import { 
    getUserNotesHistoryController, 
    getSingleNoteHistoryController,
    getUserNotesStatsController,
    deleteUserNoteController
  } from '../controllers/userHistory.controller.js';
  
const router = express.Router();

// Get all notes for a user
router.post('/notes', getUserNotesHistoryController);
  
// // Get details for a specific note
// router.post('/notes/:requestId', getSingleNoteHistoryController);
  
// Get note statistics for a user
router.get('/:email/notes-stats', getUserNotesStatsController);
  
// Delete a note
router.post('/notes/delete', deleteUserNoteController);

export default router;