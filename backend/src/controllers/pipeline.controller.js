// File: controllers/pipeline.controller.js
import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { mdToPdf } from 'md-to-pdf';
import NotesGeneratorAgent from '../agents/NotesGeneratorAgent.js';
import SyllabusAnalyzerAgent from '../agents/SyllabusAnalyzerAgent.js';
import ImageSuggestionAgent from '../agents/ImageSuggestionAgent.js';
import { NotesRequestModel } from '../models/user-request.model.js';
import {
  createRequestId,
  broadcastStage,
  broadcastMarkdownUpdate,
  broadcastError,
} from '../websocket/server.js';

dotenv.config();

// Constants
const OUTPUT_DIR = path.join(process.cwd(), 'temp');
const DEFAULT_FILENAME = 'study_notes';

// Ensure temp directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Validates the request body
 * @param {Object} body - The request body to validate
 * @returns {Object} - { isValid, errors }
 */
function validateRequest(body) {
  const errors = [];

  if (!body.syllabus) {
    errors.push('Syllabus is required');
  }

  if (body.subject_name && typeof body.subject_name !== 'string') {
    errors.push('Subject name must be a string');
  }

  if (body.note_type && !['concise', 'detailed', 'q&a'].includes(body.note_type.toLowerCase())) {
    errors.push('Note type must be one of: concise, detailed, q&a');
  }

  if (body.include_examples && !['yes', 'no'].includes(body.include_examples)) {
    errors.push("include_examples must be 'yes' or 'no'");
  }

  if (body.example_types && !Array.isArray(body.example_types)) {
    errors.push('example_types must be an array');
  }

  if (body.include_images && !['yes', 'no'].includes(body.include_images)) {
    errors.push("include_images must be 'yes' or 'no'");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Initiates the notes generation process and returns a requestId for WebSocket tracking
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function generateNotesController(req, res) {
  // Generate a unique requestId for this process
  const requestId = createRequestId();
  const startTime = Date.now();

  console.log(`[${requestId}] Initiating notes generation request`);

  try {
    // Validate request
    const { isValid, errors } = validateRequest(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    const {
      syllabus,
      subject_name = 'General Subject',
      note_type = 'detailed',
      include_examples = 'no',
      example_types = [],
      include_images = 'no',
      user_instructions = '',
    } = req.body;
    const format = req.body.format || 'pdf';

    // Store request in database
    await NotesRequestModel.create({
      request_id: requestId,
      subject_name,
      syllabus,
      note_type,
      include_examples,
      example_types,
      include_images,
      user_instructions,
      format,
      status: 'processing',
      created_at: new Date(),
    });

    // Return the requestId to the client for WebSocket connection
    res.status(202).json({
      success: true,
      message: 'Notes generation initiated',
      requestId: requestId,
      websocketUrl: `/ws?requestId=${requestId}`,
      estimatedTimeSeconds: calculateEstimatedTime(syllabus.length, note_type, include_images),
    });

    // Start the generation process in the background
    process.nextTick(() => {
      generateNotes(requestId, req.body).catch((err) => {
        console.error(`[${requestId}] Background process error:`, err);
        broadcastError(requestId, 'Generation process failed', err.message);

        // Update request status
        NotesRequestModel.updateOne(
          { request_id: requestId },
          {
            status: 'failed',
            error_message: err.message,
            processing_time_ms: Date.now() - startTime,
          }
        ).catch((updateErr) => {
          console.error(`[${requestId}] Failed to update request status:`, updateErr);
        });
      });
    });
  } catch (error) {
    console.error(`[${requestId}] Controller error:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate notes generation',
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
}

/**
 * Main function to generate notes (runs in background)
 * @param {string} requestId - Unique ID for this request
 * @param {Object} requestBody - The original request body
 */
async function generateNotes(requestId, requestBody) {
  const startTime = Date.now();
  let markdownPath = null;
  let pdfPath = null;
  let filePrefix = DEFAULT_FILENAME;
  let imageResults = [];

  try {
    const {
      syllabus,
      subject_name = 'General Subject',
      note_type = 'detailed',
      include_examples = 'no',
      example_types = [],
      include_images = 'no',
      user_instructions = '',
    } = requestBody;
    const format = requestBody.format || 'pdf';

    console.log(`[${requestId}] Generating ${note_type} notes for ${subject_name}`);
    broadcastStage(requestId, 'generation_started', {
      subject_name,
      note_type,
      include_images: include_images === 'yes',
      syllabusLength: syllabus.length,
    });

    // Prepare parameters for agents
    const params = {
      subject_name,
      syllabus,
      note_type: note_type.toLowerCase(),
      include_examples,
      example_types,
      include_images,
      user_instructions,
    };

    // Step 1: Generate analysis and prompts
    console.log(`[${requestId}] Analyzing syllabus...`);
    broadcastStage(requestId, 'analyzing_syllabus', {
      syllabusLength: syllabus.length,
    });

    const promptsList = await SyllabusAnalyzerAgent.process(params);

    if (!promptsList || promptsList.error) {
      throw new Error(`Failed to analyze syllabus: ${promptsList?.error || 'Invalid response'}`);
    }

    console.log(`[${requestId}] Generated ${promptsList.length} section prompts`);
    broadcastStage(requestId, 'syllabus_analyzed', {
      sections: promptsList.length,
      topics: promptsList.map((p) => p.topics || []),
    });

    // Step 2: Generate notes for each prompt
    console.log(`[${requestId}] Generating notes content...`);
    const notesResults = await NotesGeneratorAgent.generateMultipleNotes(
      promptsList,
      params,
      requestId
    );

    // Step 3: Handle image suggestions and integration if enabled
    let combinedMarkdown = '';
    if (include_images === 'yes') {
      console.log(`[${requestId}] Generating image suggestions...`);
      broadcastStage(requestId, 'generating_image_suggestions');
      const imageSuggestions = await ImageSuggestionAgent.generateImageSuggestions(notesResults);

      console.log(`[${requestId}] Finding and downloading images...`);
      broadcastStage(requestId, 'downloading_images', {
        count: imageSuggestions.length,
      });

      imageResults = await ImageSuggestionAgent.findAndDownloadImages(imageSuggestions);

      // Combine notes first
      combinedMarkdown = NotesGeneratorAgent.combineNotes(notesResults, requestId);

      // Then integrate images
      console.log(
        `[${requestId}] Integrating ${imageResults.filter((img) => img.success).length} images into notes...`
      );
      broadcastStage(requestId, 'integrating_images', {
        count: imageResults.filter((img) => img.success).length,
      });

      combinedMarkdown = ImageSuggestionAgent.integrateImagesIntoMarkdown(
        combinedMarkdown,
        imageResults
      );

      // Broadcast final markdown with images
      broadcastMarkdownUpdate(requestId, combinedMarkdown, null, true);
    } else {
      // Just combine notes without images
      combinedMarkdown = NotesGeneratorAgent.combineNotes(notesResults, requestId);
    }

    // Prepare filename
    const sanitizedSubject = subject_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    filePrefix = `${sanitizedSubject}_${note_type}_${timestamp}`;

    // Create a dedicated output directory for this request
    const requestOutputDir = path.join(OUTPUT_DIR, requestId);
    if (!fs.existsSync(requestOutputDir)) {
      fs.mkdirSync(requestOutputDir, { recursive: true });
    }

    // Step 4: Save markdown
    markdownPath = path.join(requestOutputDir, `${filePrefix}.md`);
    fs.writeFileSync(markdownPath, combinedMarkdown);
    broadcastStage(requestId, 'markdown_saved', {
      path: markdownPath,
    });

    // Handle images if needed
    if (include_images === 'yes' && imageResults.some((img) => img.success)) {
      const imagesDir = path.join(requestOutputDir, 'images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      // Update image paths in markdown and copy images
      broadcastStage(requestId, 'processing_images');
      for (const imageResult of imageResults) {
        if (imageResult.success && imageResult.localPath) {
          const imageName = path.basename(imageResult.localPath);
          const newImagePath = path.join(imagesDir, imageName);
          fs.copyFileSync(imageResult.localPath, newImagePath);

          // Update the path in the markdown
          const oldPath = imageResult.localPath.replace(/\\/g, '/');
          const newPath = `./images/${imageName}`;
          combinedMarkdown = combinedMarkdown.replace(oldPath, newPath);
        }
      }

      // Write updated markdown
      fs.writeFileSync(markdownPath, combinedMarkdown);
    }

    // Step 5: Generate PDF if requested
    if (format.toLowerCase() === 'pdf') {
      broadcastStage(requestId, 'generating_pdf');
      pdfPath = path.join(requestOutputDir, `${filePrefix}.pdf`);

      try {
        // Stream PDF generation progress
        let pdfProgress = 0;
        const intervalId = setInterval(() => {
          // Simulate PDF generation progress
          pdfProgress += 10;
          if (pdfProgress <= 90) {
            broadcastStage(requestId, 'pdf_generation_progress', { progress: pdfProgress });
          }
        }, 500);

        // Setup PDF generation with relative path support for images
        const { content } = await mdToPdf({
          path: markdownPath,
          pdf_options: {
            format: 'A4',
            margin: '20mm',
            printBackground: true,
          },
          launch_options: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          },
        });

        clearInterval(intervalId);

        fs.writeFileSync(pdfPath, content);
        broadcastStage(requestId, 'pdf_generation_complete', {
          path: pdfPath,
          downloadId: requestId,
        });
      } catch (pdfError) {
        console.error(`[${requestId}] PDF generation error:`, pdfError);
        broadcastStage(requestId, 'pdf_generation_failed', {
          error: pdfError.message,
          fallback: 'Creating ZIP package instead',
        });

        // Fallback to creating a zip
        await createZipArchive(requestId, requestOutputDir, filePrefix);
      }
    } else {
      // Create a ZIP archive for markdown format
      await createZipArchive(requestId, requestOutputDir, filePrefix);
    }

    // Final success message
    broadcastStage(requestId, 'generation_complete', {
      filePrefix,
      format,
      processingTime: Date.now() - startTime,
      downloadId: requestId,
    });

    // Update request status in database
    await NotesRequestModel.updateOne(
      { request_id: requestId },
      {
        status: 'completed',
        processing_time_ms: Date.now() - startTime,
        output_file: {
          filename: `${filePrefix}.${format.toLowerCase() === 'pdf' ? 'pdf' : 'zip'}`,
          directory: requestId,
        },
        image_count: imageResults.filter((img) => img.success).length,
        completed_at: new Date(),
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Generation process error:`, error);
    broadcastError(requestId, 'Generation process failed', error.message);

    // Update request status in database
    await NotesRequestModel.updateOne(
      { request_id: requestId },
      {
        status: 'failed',
        error_message: error.message,
        processing_time_ms: Date.now() - startTime,
      }
    );
  }
}

/**
 * Creates a ZIP archive of the generated content
 * @param {string} requestId - The unique request ID
 * @param {string} sourceDir - Directory containing content to zip
 * @param {string} filePrefix - Prefix for the zip filename
 */
async function createZipArchive(requestId, sourceDir, filePrefix) {
  broadcastStage(requestId, 'creating_zip');

  const archiver = require('archiver');
  const zipPath = path.join(OUTPUT_DIR, `${filePrefix}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', function () {
      console.log(`[${requestId}] Zip archive created: ${zipPath} (${archive.pointer()} bytes)`);
      broadcastStage(requestId, 'zip_created', {
        path: zipPath,
        size: archive.pointer(),
        downloadId: requestId,
      });
      resolve(zipPath);
    });

    archive.on('error', function (err) {
      console.error(`[${requestId}] Zip creation error:`, err);
      broadcastError(requestId, 'Failed to create zip archive', err.message);
      reject(err);
    });

    archive.pipe(output);

    // Add progress event
    archive.on('progress', (data) => {
      broadcastStage(requestId, 'zip_progress', {
        entries: data.entries.processed,
        totalEntries: data.entries.total,
        byteProgress: data.fs.processedBytes,
        totalBytes: data.fs.totalBytes,
      });
    });

    // Add the entire request directory to the zip
    archive.directory(sourceDir, false);

    // Finalize the archive
    archive.finalize();
  });
}

/**
 * Calculate estimated time for generation based on syllabus complexity
 * @param {number} syllabusLength - Length of syllabus text
 * @param {string} noteType - Type of notes
 * @param {string} includeImages - Whether to include images
 * @returns {number} - Estimated time in seconds
 */
function calculateEstimatedTime(syllabusLength, noteType, includeImages) {
  // Base time
  let baseTime = 30; // 30 seconds baseline

  // Add time based on syllabus length
  baseTime += Math.floor(syllabusLength / 500) * 15; // 15 seconds per 500 chars

  // Adjust for note type
  if (noteType === 'detailed') baseTime *= 1.5;
  if (noteType === 'q&a') baseTime *= 1.3;

  // Add time for images
  if (includeImages === 'yes') baseTime += 45;

  return Math.floor(baseTime); // Return whole seconds
}

/**
 * Controller for downloading generated files
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function downloadGeneratedNotesController(req, res) {
  const { requestId } = req.body;
  console.log(`Downloading file for request ${requestId}`);
  try {
    // Verify the request exists and is completed
    const request = await NotesRequestModel.findOne({ request_id: requestId });

    // if (!request) {
    //   return res.status(404).json({
    //     success: false,
    //     error: 'Request not found',
    //   });
    // }

    // if (request.status !== 'completed') {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'Notes generation is not yet complete',
    //     status: request.status,
    //   });
    // }

    // Construct the directory path
    const dirPath = path.join(OUTPUT_DIR, requestId);

    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      return res.status(404).json({
        success: false,
        error: 'Output directory not found',
      });
    }

    // Find PDF files in the directory
    const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.pdf'));

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No PDF file found in the output directory',
      });
    }

    // Use the first PDF file found
    const pdfFilename = files[0];
    const filePath = path.join(dirPath, pdfFilename);

    // Send the file
    res.download(filePath, pdfFilename);
  } catch (error) {
    console.error(`Error downloading file for request ${requestId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file',
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
}

/**
 * Controller for getting status of a note generation request
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function getGenerationStatus(req, res) {
  const { requestId } = req.params;

  try {
    const request = await NotesRequestModel.findOne({ request_id: requestId });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
      });
    }

    res.status(200).json({
      success: true,
      requestId: request.request_id,
      status: request.status,
      subject: request.subject_name,
      noteType: request.note_type,
      createdAt: request.created_at,
      processingTime: request.processing_time_ms,
      outputFile: request.output_file,
      error: request.error_message,
      websocketUrl: `/ws?requestId=${requestId}`,
      downloadId: request.status === 'completed' && request.output_file ? requestId : null,
    });
  } catch (error) {
    console.error(`Error fetching status for request ${requestId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve generation status',
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
}

/**
 * Controller for status check endpoint
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export function healthCheck(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Notes generator API is running',
    timestamp: new Date().toISOString(),
  });
}
