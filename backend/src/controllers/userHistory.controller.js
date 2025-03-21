// File: controllers/user.history.controller.js
import { NotesRequestModel } from '../models/user-request.model.js';
import { UserModel } from '../models/user.model.js';

/**
 * Retrieves all notes generation requests for a specific user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function getUserNotesHistoryController(req, res) {
  const { email } = req.params;
  console.log(`Retrieving notes history for user: ${email}`);

  try {
    // Find the user by email
    const userDoc = await UserModel.findOne({ email: email });
    
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    // Find all notes requests for this user
    const notesRequests = await NotesRequestModel.find(
      { _userID: userDoc._id },
      {
        _id: 1,
        subject_name: 1,
        note_type: 1,
        format: 1,
        status: 1,
        processing_time_ms: 1,
        createdAt: 1,
        updatedAt: 1,
        secure_url: 1,
        include_images: 1,
        error: 1
      }
    ).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: notesRequests.length,
      data: notesRequests,
    });
  } catch (error) {
    console.error(`Error retrieving notes history for user ${email}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notes history',
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
}

/**
 * Retrieves a single note generation request with details
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function getSingleNoteHistoryController(req, res) {
  const { email, requestId } = req.params;
  console.log(`Retrieving note details for user: ${email}, requestId: ${requestId}`);

  try {
    // Find the user by email
    const userDoc = await UserModel.findOne({ email: email });
    
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    // Find the specific note request for this user
    const noteRequest = await NotesRequestModel.findOne({
      _id: requestId,
      _userID: userDoc._id
    });
    
    if (!noteRequest) {
      return res.status(404).json({
        success: false,
        error: 'Note request not found or does not belong to this user',
      });
    }
    
    res.status(200).json({
      success: true,
      data: noteRequest,
      downloadUrl: noteRequest.status === 'completed' ? noteRequest.secure_url : null,
    });
  } catch (error) {
    console.error(`Error retrieving note details for user ${email}, requestId ${requestId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve note details',
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
}

/**
 * Gets a count of notes by status for a specific user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function getUserNotesStatsController(req, res) {
  const { email } = req.params;
  console.log(`Retrieving notes statistics for user: ${email}`);

  try {
    // Find the user by email
    const userDoc = await UserModel.findOne({ email: email });
    
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    // Aggregate notes statistics by status
    const stats = await NotesRequestModel.aggregate([
      { $match: { _userID: userDoc._id } },
      { $group: {
          _id: "$status",
          count: { $sum: 1 },
          averageProcessingTime: { $avg: "$processing_time_ms" }
        }
      },
      { $project: {
          status: "$_id",
          count: 1,
          averageProcessingTime: 1,
          _id: 0
        }
      }
    ]);
    
    // Get total count
    const totalCount = await NotesRequestModel.countDocuments({ _userID: userDoc._id });
    
    // Get the most recent request
    const latestRequest = await NotesRequestModel.findOne(
      { _userID: userDoc._id },
      { subject_name: 1, createdAt: 1, status: 1 }
    ).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      totalNotes: totalCount,
      statusBreakdown: stats,
      latestRequest: latestRequest || null,
    });
  } catch (error) {
    console.error(`Error retrieving notes statistics for user ${email}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notes statistics',
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
}

/**
 * Deletes a note request for a specific user (if allowed by your business logic)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function deleteUserNoteController(req, res) {
  const { email, requestId } = req.params;
  console.log(`Attempting to delete note for user: ${email}, requestId: ${requestId}`);

  try {
    // Find the user by email
    const userDoc = await UserModel.findOne({ email: email });
    
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    // Find and delete the note request
    const result = await NotesRequestModel.findOneAndDelete({
      _id: requestId,
      _userID: userDoc._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Note request not found or does not belong to this user',
      });
    }
    
    // You might want to also delete associated files here
    // This would depend on your storage setup
    
    res.status(200).json({
      success: true,
      message: 'Note request deleted successfully',
    });
  } catch (error) {
    console.error(`Error deleting note for user ${email}, requestId ${requestId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note request',
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
}