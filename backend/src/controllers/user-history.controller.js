// File: controllers/user.history.controller.js
import mongoose from 'mongoose';
import { NotesRequestModel } from '../models/user-request.model.js';
import { UserModel } from '../models/user.model.js';
import { deletePDFFromCloudinary } from '../utils/cloudinary-file-upload.util.js';

/**
 * Retrieves all notes generation requests for a specific user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function getUserNotesHistoryController(req, res) {
  const { email } = req.body;
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
      { _userID: userDoc._id, status: 'completed' },
      {
        _id: 1,
        subject_name: 1,
        display_name: 1,
        note_type: 1,
        format: 1,
        status: 1,
        processing_time_ms: 1,
        createdAt: 1,
        updatedAt: 1,
        secure_url: 1,
        include_images: 1,
        error: 1,
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
  const { email } = req.body;
  const { requestId } = req.params;
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
      _userID: userDoc._id,
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
    console.error(
      `Error retrieving note details for user ${email}, requestId ${requestId}:`,
      error
    );
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
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          averageProcessingTime: { $avg: '$processing_time_ms' },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          averageProcessingTime: 1,
          _id: 0,
        },
      },
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
  const { email, requestId } = req.body; // requestId should be an array of valid MongoDB ObjectIds

  if (!Array.isArray(requestId) || requestId.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request: requestId must be a non-empty array',
    });
  }
  console.log(`Deleting notes for user: ${email}, requestId: ${requestId}`);

  let objectIds = [];
  try {
    objectIds = requestId.map((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ObjectId: ${id}`);
      }
      return new mongoose.Types.ObjectId(id);
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  try {
    // Find the user by email
    const userDoc = await UserModel.findOne({ email });

    if (!userDoc) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Find and delete the note requests
    const notesToDelete = await NotesRequestModel.find({
      _id: { $in: objectIds },
      _userID: userDoc._id,
    });

    if (!notesToDelete.length) {
      return res.status(404).json({
        success: false,
        error: 'No matching note requests found for this user',
      });
    }

    // Delete notes
    await NotesRequestModel.deleteMany({ _id: { $in: objectIds }, _userID: userDoc._id });

    // Delete associated files from Cloudinary
    notesToDelete.forEach((note) => {
      if (note.public_id) {
        deletePDFFromCloudinary(note.public_id);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Note requests deleted successfully',
      deletedCount: notesToDelete.length,
    });
  } catch (error) {
    console.error(`Error deleting notes for user ${email}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note requests',
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
}

/**
 * Updates the display name of a specific note request
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function updateNoteDisplayNameController(req, res) {
  const { _id, display_name } = req.body;

  if (!_id || !display_name) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: _id and display_name',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ObjectId format for _id',
    });
  }

  try {
    const updatedNote = await NotesRequestModel.findByIdAndUpdate(
      _id,
      { display_name },
      { new: true, runValidators: true }
    );

    if (!updatedNote) {
      return res.status(404).json({
        success: false,
        error: 'Note request not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Display name updated successfully',
      data: updatedNote,
    });
  } catch (error) {
    console.error(`Error updating display_name for note request ${_id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to update display name',
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
}
