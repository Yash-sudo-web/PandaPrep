// File: controllers/pipeline.controller.js
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { mdToPdf } from 'md-to-pdf';
import NotesGeneratorAgent from '../agents/NotesGeneratorAgent.js';
import SyllabusAnalyzerAgent from '../agents/SyllabusAnalyzerAgent.js';
import ImageSuggestionAgent from '../agents/ImageSuggestionAgent.js';
import ImageGeneratorAgent from '../agents/ImageGeneratorAgent.js';
import { NotesRequestModel } from '../models/user-request.model.js';
import { UserModel } from '../models/user.model.js';
import { uploadPDFToCloudinary } from '../utils/cloudinary-file-upload.util.js';
import { addWatermarkToPdf } from '../utils/pdf-watermark-addition.util.js';
import { convertLatexToMathJax } from '../utils/latex-to-image.util.js';
import { addToQueue, getQueueStatus } from '../utils/queue-config.js';

import {
  createRequestId,
  broadcastStage,
  broadcastMarkdownUpdate,
  broadcastError,
} from '../websocket/server.js';
import axios from 'axios';
import { cssStyles } from '../constants/md-css.js';
import { log } from 'console';
import { sendNotesReadyEmail } from '../utils/email.util.js';
import ChatWithNotesAgent from '../agents/ChatWithNotesAgent.js';

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
 * @returns {Object} - { isValid, error }
 */
function validateRequest(body) {
  const error = [];

  if (!body.syllabus) {
    error.push('Syllabus is required');
  }

  if (!body.subject_name) {
    error.push('Subject name is required');
  }

  if (body.subject_name && typeof body.subject_name !== 'string') {
    error.push('Subject name must be a string');
  }

  if (body.note_type && !['concise', 'detailed', 'qa'].includes(body.note_type.toLowerCase())) {
    error.push('Note type must be one of: concise, detailed, qa');
  }

  if (body.include_examples && !['yes', 'no'].includes(body.include_examples)) {
    error.push("include_examples must be 'yes' or 'no'");
  }

  if (body.include_images && !['yes', 'no'].includes(body.include_images)) {
    error.push("include_images must be 'yes' or 'no'");
  }

  if (
    body.education_level &&
    !['beginner', 'intermediate', 'advanced'].includes(body.education_level.toLowerCase())
  ) {
    error.push('education_level must be one of: beginner, intermediate, advanced');
  }

  return {
    isValid: error.length === 0,
    error,
  };
}

async function downloadPdfFromUrl(pdfUrl, requestId) {
  const response = await axios.get(pdfUrl, { responseType: 'stream' });
  const fileName = `reference_${requestId}_${Date.now()}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filePath));
    writer.on('error', reject);
  });
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
    const { isValid, error } = validateRequest(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error,
      });
    }

    const {
      email,
      syllabus,
      subject_name = 'General Subject',
      note_type = 'concise',
      include_examples = 'no',
      include_images = 'no',
      education_level = 'intermediate',
      user_instructions = '',
      relativePathToReferenceMaterial = null,
    } = req.body;
    const format = req.body.format || 'pdf';
    const userDoc = await UserModel.findOne({ email: email });

    // Store request in database
    const request = await NotesRequestModel.create({
      _userID: userDoc._id,
      subject_name,
      display_name: subject_name,
      syllabus,
      note_type,
      include_examples,
      include_images,
      education_level,
      user_instructions,
      relativePathToReferenceMaterial,
      format,
      status: 'pending',
      created_at: new Date(),
      requestId: requestId,
    });

    if (request.note_type === 'detailed' || request.include_images === 'yes') {
      if (userDoc.subscription.credits <= 0) {
        await request.updateOne({
          status: 'failed',
          error_message: 'Insufficient credits for this request',
        });
        return res.status(400).json({
          success: false,
          error: 'Insufficient credits for this request',
        });
      }
    }

    // Add the job to the queue - REMOVED generateNotes function parameter
    const job = await addToQueue(requestId, {
      requestBody: req.body,
      requestIdDb: request._id,
      userId: request._userID,
    });

    await request.updateOne({
      status: 'queued',
    });

    const queueStatus = await getQueueStatus(job.id);

    // Return the requestId and job information to the client
    res.status(202).json({
      success: true,
      message: 'Notes generation queued',
      requestId: requestId,
      jobId: job.id,
      queueStatus: queueStatus,
      websocketUrl: `/ws?requestId=${requestId}`,
      estimatedTimeSeconds: calculateEstimatedTime(
        syllabus.length,
        note_type,
        include_images,
        education_level
      ),
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
 * Cleanup function to remove temporary files after processing
 * @param {string} requestId - The request ID for logging
 * @param {string} requestOutputDir - Directory containing request-specific files
 * @param {string} zipPath - Path to ZIP file (if created)
 * @param {string} referencePdfPath - Path to reference PDF (if downloaded)
 * @param {string} vectorStorePath - Path to vector store files (if created)
 */
async function cleanupTempFiles(requestId, requestOutputDir, zipPath = null, referencePdfPath = null, vectorStorePath = null) {
  console.log(`[${requestId}] Starting cleanup of temporary files...`);
  
  const filesToClean = [];
  const dirsToClean = [];

  try {
    // 1. Clean up request output directory (contains markdown and PDF)
    if (requestOutputDir && fs.existsSync(requestOutputDir)) {
      dirsToClean.push(requestOutputDir);
      console.log(`[${requestId}] Marked request directory for cleanup: ${requestOutputDir}`);
    }

    // 2. Clean up ZIP file
    if (zipPath && fs.existsSync(zipPath)) {
      filesToClean.push(zipPath);
      console.log(`[${requestId}] Marked ZIP file for cleanup: ${zipPath}`);
    }

    // 3. Clean up reference PDF (if not already cleaned)
    if (referencePdfPath && fs.existsSync(referencePdfPath)) {
      filesToClean.push(referencePdfPath);
      console.log(`[${requestId}] Marked reference PDF for cleanup: ${referencePdfPath}`);
    }

    // 4. Clean up vector store files
    if (vectorStorePath && fs.existsSync(vectorStorePath)) {
      // Vector store might be a directory or file
      const stats = fs.statSync(vectorStorePath);
      if (stats.isDirectory()) {
        dirsToClean.push(vectorStorePath);
      } else {
        filesToClean.push(vectorStorePath);
      }
      console.log(`[${requestId}] Marked vector store for cleanup: ${vectorStorePath}`);
    }

    // Delete individual files
    for (const file of filesToClean) {
      try {
        fs.unlinkSync(file);
        console.log(`[${requestId}] ✓ Deleted file: ${file}`);
      } catch (error) {
        console.warn(`[${requestId}] ⚠ Failed to delete file ${file}:`, error.message);
      }
    }

    // Delete directories recursively
    for (const dir of dirsToClean) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`[${requestId}] ✓ Deleted directory: ${dir}`);
      } catch (error) {
        console.warn(`[${requestId}] ⚠ Failed to delete directory ${dir}:`, error.message);
      }
    }

    console.log(`[${requestId}] Cleanup completed successfully`);
  } catch (error) {
    console.error(`[${requestId}] Error during cleanup:`, error);
  }
}

/**
 * Main function to generate notes (runs in background)
 * EXPORTED so it can be imported by the worker
 * @param {string} requestId - Unique ID for this request
 * @param {Object} requestBody - The original request body
 * @param {string} requestIdDb - Database ID for the request
 * @param {string} _userId - User ID
 */
export async function generateNotes(requestId, requestBody, requestIdDb, _userId) {
  const startTime = Date.now();
  let markdownPath = null;
  let pdfPath = null;
  let filePrefix = DEFAULT_FILENAME;
  let imageResults = [];
  let downloadUrl = '';
  let content = '';

  let referencePdfPath = null;
  let vectorStorePath = null;
  let documentId = null;
  let requestOutputDir = null;
  let zipPath = null;

  // Handle reference PDF download and processing
  if (requestBody.relativePathToReferenceMaterial) {
    try {
      console.log(`[${requestId}] Downloading reference PDF...`);
      broadcastStage(requestId, 'downloading_reference_pdf');
      
      referencePdfPath = await downloadPdfFromUrl(requestBody.relativePathToReferenceMaterial, requestId);
      documentId = `ref-${requestId}`;
      console.log(`[${requestId}] Reference PDF downloaded to ${referencePdfPath}`);
      
      console.log(`[${requestId}] Processing reference PDF for context...`);
      
      vectorStorePath = await ChatWithNotesAgent.processPdfDocument(referencePdfPath, documentId);

    } catch (error) {
      console.warn(`[${requestId}] Failed to process reference PDF:`, error.message);
    }
  }

  try {
    const {
      syllabus,
      subject_name = 'General Subject',
      note_type = 'concise',
      include_examples = 'no',
      include_images = 'no',
      education_level = 'intermediate',
      user_instructions = '',
      relativePathToReferenceMaterial = null,
    } = requestBody;
    const format = requestBody.format || 'pdf';

    console.log(
      `[${requestId}] Generating ${note_type} notes for ${subject_name} at ${education_level} level`
    );
    broadcastStage(requestId, 'generation_started', {
      subject_name,
      note_type,
      education_level,
      include_images: include_images === 'yes',
      syllabusLength: syllabus.length,
    });

    // Prepare parameters for agents
    const params = {
      subject_name,
      syllabus,
      note_type: note_type.toLowerCase(),
      include_examples,
      include_images,
      education_level,
      user_instructions,
      relativePathToReferenceMaterial,
      vectorStorePath,
      documentId,
      hasReferenceContext: !!vectorStorePath
    };

    await NotesRequestModel.updateOne(
      { _id: requestIdDb },
      {
        status: 'processing',
      }
    );

    // Step 1: Generate analysis and prompts
    console.log(`[${requestId}] Analyzing syllabus...`);
    broadcastStage(requestId, 'analyzing_syllabus', {
      syllabusLength: syllabus.length,
      education_level,
    });

    const promptsList = await SyllabusAnalyzerAgent.process(params);

    if (!promptsList || promptsList.error) {
      throw new Error(`Failed to analyze syllabus: ${promptsList?.error || 'Invalid response'}`);
    }

    console.log(`[${requestId}] Generated ${promptsList.length} section prompts`);
    broadcastStage(requestId, 'syllabus_analyzed', {
      sections: promptsList.length,
      topics: promptsList.map((p) => p.topics || []),
      education_level,
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

      console.log(`[${requestId}] Generating images using Gemini...`);
      broadcastStage(requestId, 'generating_images', {
        count: imageSuggestions.length,
      });

      // Use the ImageGeneratorAgent to generate images with Base64 encoding
      imageResults = await ImageGeneratorAgent.generateImagesBase64(imageSuggestions);

      // Combine notes first
      combinedMarkdown = NotesGeneratorAgent.combineNotes(notesResults, requestId);

      // Then integrate images with Base64 encoding
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
    filePrefix = `${sanitizedSubject}_${note_type}_${education_level}_${timestamp}`;

    // Create a dedicated output directory for this request
    requestOutputDir = path.join(OUTPUT_DIR, requestIdDb.toString());
    if (!fs.existsSync(requestOutputDir)) {
      fs.mkdirSync(requestOutputDir, { recursive: true });
    }

    console.log(`[${requestId}] Processing LaTeX formulas with MathJax...`);
    broadcastStage(requestId, 'processing_latex_formulas', {
      message: 'Converting mathematical formulas with MathJax',
    });

    try {
      // First check if there are any formulas to process
      const hasFormulas = combinedMarkdown.includes('$');

      if (hasFormulas) {
        console.log(`[${requestId}] Found LaTeX formulas, converting with MathJax...`);

        // Process in chunks for very large documents
        if (combinedMarkdown.length > 50000) {
          console.log(`[${requestId}] Large document detected, processing in chunks...`);

          // Split by section headers
          const sections = combinedMarkdown.split(/(?=#{1,3}\s)/);
          let processedMarkdown = '';

          for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const hasLatex = section.includes('$');

            broadcastStage(requestId, 'processing_latex_section', {
              current: i + 1,
              total: sections.length,
              progress: Math.round(((i + 1) / sections.length) * 100),
            });

            if (hasLatex) {
              const processedSection = await convertLatexToMathJax(section);
              processedMarkdown += processedSection;
            } else {
              processedMarkdown += section;
            }
          }

          combinedMarkdown = processedMarkdown;
        } else {
          // Process the entire document at once
          combinedMarkdown = await convertLatexToMathJax(combinedMarkdown);
        }

        broadcastStage(requestId, 'latex_formulas_processed', {
          success: true,
        });
      } else {
        console.log(`[${requestId}] No LaTeX formulas found, skipping conversion.`);
        broadcastStage(requestId, 'latex_formulas_skipped', {
          message: 'No mathematical formulas detected',
        });
      }
    } catch (latexError) {
      console.error(`[${requestId}] LaTeX processing error:`, latexError);
      broadcastStage(requestId, 'latex_processing_warning', {
        error: latexError.message,
        message: 'Some formulas may not display correctly in the PDF',
      });
    }

    // Step 5: Save markdown
    markdownPath = path.join(requestOutputDir, `${filePrefix}.md`);
    fs.writeFileSync(markdownPath, combinedMarkdown);
    broadcastStage(requestId, 'markdown_saved', {
      path: markdownPath,
    });

    // Step 6: Generate PDF if requested
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

        let attempts = 0;
        let content;

        while (attempts < 3 && !content) {
          try {
            const markdownContent = await fs.promises.readFile(markdownPath, 'utf8');

            const data = {
              markdown: markdownContent,
              css: cssStyles,
            };

            content = await axios.post(process.env.MICROSERVICE_LINK, data, {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              responseType: 'arraybuffer',
            });
          } catch (error) {
            console.log(`Attempt ${attempts + 1} failed:`, error);
          }

          attempts++;
        }

        if (!content) {
          const pdfError = new Error('Content is undefined after 3 attempts.');
          broadcastStage(requestId, 'pdf_generation_failed', {
            error: pdfError.message,
          });
          throw pdfError;
        }

        fs.writeFileSync(pdfPath, content.data);
        await addWatermarkToPdf(pdfPath);

        clearInterval(intervalId);

        const uploadResponse = await uploadPDFToCloudinary(
          _userId,
          pdfPath,
          `${filePrefix}.pdf`,
          'pdfGeneration'
        );
        downloadUrl = uploadResponse.secure_url;
        
        if (uploadResponse && uploadResponse.secure_url) {
          await NotesRequestModel.updateOne(
            { _id: requestIdDb },
            {
              secure_url: uploadResponse.secure_url,
              public_id: uploadResponse.public_id,
            }
          );
        } else {
          throw new Error('Failed to upload PDF to Cloudinary');
        }

        broadcastStage(requestId, 'pdf_generation_complete', {
          path: pdfPath,
          downloadId: downloadUrl,
        });

        // Final success message
        broadcastStage(requestId, 'generation_complete', {
          filePrefix,
          format,
          processingTime: Date.now() - startTime,
          downloadId: downloadUrl,
        });

        // Update request status in database
        await NotesRequestModel.updateOne(
          { _id: requestIdDb },
          {
            status: 'completed',
            processing_time_ms: Date.now() - startTime,
            output_file: {
              filename: `${filePrefix}.${format.toLowerCase() === 'pdf' ? 'pdf' : 'zip'}`,
              directory: requestIdDb.toString(),
            },
            image_count: imageResults.filter((img) => img.success).length,
            completed_at: new Date(),
          }
        );

        if (note_type === 'detailed') {
          await UserModel.updateOne({ _id: _userId }, { $inc: { 'subscription.credits': -1 } });
        }

        const user = await UserModel.findById(_userId);

        const firstName = user.displayName
          ? user.displayName.split(' ')[0]
          : user.email.split('@')[0];

        const res = await sendNotesReadyEmail({
          userEmail: user.email,
          userName: firstName,
          subjectName: subject_name,
          downloadUrl: downloadUrl,
        });

        if (res.success) {
          console.log(`[${requestId}] Email sent successfully to ${user.email}: ${res.messageId}`);
        }

        // CLEANUP: After successful PDF upload to Cloudinary
        console.log(`[${requestId}] PDF uploaded successfully, cleaning up local files...`);
        await cleanupTempFiles(requestId, requestOutputDir, null, referencePdfPath, vectorStorePath);

      } catch (pdfError) {
        console.error(`[${requestId}] PDF generation error:`, pdfError);
        
        // CLEANUP: Even on error, clean up what we can
        console.log(`[${requestId}] PDF generation failed, cleaning up local files...`);
        await cleanupTempFiles(requestId, requestOutputDir, null, referencePdfPath, vectorStorePath);
        
        broadcastStage(requestId, 'pdf_generation_failed', {
          error: pdfError.message,
        });
        throw pdfError; // Re-throw to be caught by outer try-catch
      }
    } else {
      // Create a ZIP archive for markdown format
      zipPath = await createZipArchive(requestId, requestOutputDir, filePrefix, downloadUrl);
      
      // CLEANUP: After ZIP creation, clean up all temporary files
      console.log(`[${requestId}] ZIP created successfully, cleaning up local files...`);
      await cleanupTempFiles(requestId, requestOutputDir, zipPath, referencePdfPath, vectorStorePath);
    }

  } catch (error) {
    console.error(`[${requestId}] Generation process error:`, error);
    
    // CLEANUP: On any error, attempt to clean up temporary files
    console.log(`[${requestId}] Error occurred, attempting cleanup...`);
    await cleanupTempFiles(requestId, requestOutputDir, zipPath, referencePdfPath, vectorStorePath);
    
    broadcastError(requestId, 'Generation process failed', error.message);

    // Update request status in database
    await NotesRequestModel.updateOne(
      { _id: requestIdDb },
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
async function createZipArchive(requestId, sourceDir, filePrefix, downloadUrl) {
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
        downloadId: downloadUrl,
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
 * @param {string} educationLevel - Education level for the notes
 * @returns {number} - Estimated time in seconds
 */
function calculateEstimatedTime(
  syllabusLength,
  noteType,
  includeImages,
  educationLevel = 'intermediate'
) {
  // Base time
  let baseTime = 30; // 30 seconds baseline

  // Add time based on syllabus length
  baseTime += Math.floor(syllabusLength / 500) * 15; // 15 seconds per 500 chars

  // Adjust for note type
  if (noteType === 'detailed') baseTime *= 1.5;
  if (noteType === 'qa') baseTime *= 1.3;

  // Adjust for education level
  if (educationLevel === 'advanced') baseTime *= 1.2;
  if (educationLevel === 'beginner') baseTime *= 0.9;

  // Add time for images
  if (includeImages === 'yes') baseTime += 45;

  return Math.floor(baseTime); // Return whole seconds
}

/**
 * Controller for getting status of a note generation request
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function getGenerationStatus(req, res) {
  try {
    const { requestId } = req.params;
    const request = await NotesRequestModel.findOne({ requestId });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
      });
    }

    // Get queue status if job ID exists
    let queueInfo = null;
    if (request.jobId) {
      queueInfo = await getQueueStatus(request.jobId);
    }

    res.json({
      success: true,
      status: request.status,
      error: request.error_message,
      progress: request.progress,
      queuePosition: queueInfo?.position || 0,
      queueState: queueInfo?.state || 'unknown',
      downloadUrl: request.download_url,
    });
  } catch (error) {
    console.error('Error getting generation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get generation status',
    });
  }
}
