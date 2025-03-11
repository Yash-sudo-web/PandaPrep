// File: controllers/pipeline.controller.js
import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { mdToPdf } from 'md-to-pdf';
import NotesGeneratorAgent from '../agents/NotesGeneratorAgent.js';
import SyllabusAnalyzerAgent from '../agents/SyllabusAnalyzerAgent.js';
import { v4 as uuidv4 } from 'uuid';
import { NotesRequestModel } from '../models/user-request.model.js';

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

  if (body.include_examples && !['Yes', 'No'].includes(body.include_examples)) {
    errors.push("include_examples must be 'Yes' or 'No'");
  }

  if (body.example_types && !Array.isArray(body.example_types)) {
    errors.push('example_types must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Handles file cleanup
 * @param {string} filePath - Path of file to clean up
 */
function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error);
  }
}

/**
 * Controller for generating study notes
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function generateNotesController(req, res) {
  const requestId = uuidv4();
  const startTime = Date.now();
  let markdownPath = null;
  let pdfPath = null;
  let reqLog = null;
  let filePrefix = DEFAULT_FILENAME;

  console.log(`[${requestId}] Processing notes generation request`);

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
      include_examples = 'No',
      example_types = [],
      user_instructions = '',
      format = 'pdf', // 'pdf' or 'markdown'
    } = req.body;

    console.log(`[${requestId}] Generating ${note_type} notes for ${subject_name}`);

    // Prepare parameters for agents
    const params = {
      subject_name,
      syllabus,
      note_type: note_type.toLowerCase(),
      include_examples,
      example_types,
      user_instructions,
    };

    // Store request in database
    reqLog = await NotesRequestModel.create({
      request_id: requestId,
      subject_name,
      syllabus,
      note_type,
      include_examples,
      example_types,
      user_instructions,
      format,
    });

    // Step 1: Generate analysis and prompts
    console.log(`[${requestId}] Analyzing syllabus...`);
    const promptsList = await SyllabusAnalyzerAgent.process(params);

    if (!promptsList || promptsList.error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to analyze syllabus',
        details: promptsList?.error ? promptsList : 'Invalid response from analyzer',
      });
    }

    console.log(`[${requestId}] Generated ${promptsList.length} section prompts`);

    // Step 2: Generate notes for each prompt
    console.log(`[${requestId}] Generating notes content...`);
    const notesResults = await NotesGeneratorAgent.generateMultipleNotes(promptsList, params);

    // Step 3: Combine notes
    const combinedMarkdown = NotesGeneratorAgent.combineNotes(notesResults);

    // Prepare filename
    const sanitizedSubject = subject_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    console.log(`[${requestId}] Sanitized subject name: ${sanitizedSubject}`);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    filePrefix = `${sanitizedSubject}_${note_type}_${timestamp}`;
    console.log(`[${requestId}] File prefix: ${filePrefix}`);

    // Step 4: Save and deliver content based on requested format
    if (format.toLowerCase() === 'markdown') {
      // Return markdown directly
      markdownPath = path.join(OUTPUT_DIR, `${filePrefix}.md`);
      fs.writeFileSync(markdownPath, combinedMarkdown);

      console.log(`[${requestId}] Returning markdown content`);
      return res.download(markdownPath, `${filePrefix}.md`, (err) => {
        if (err) {
          console.error(`[${requestId}] Download error:`, err);
        }
        cleanupFile(markdownPath);
      });
    } else {
      // Generate PDF
      console.log(`[${requestId}] Converting to PDF...`);
      pdfPath = path.join(OUTPUT_DIR, `${filePrefix}.pdf`);

      try {
        const { content } = await mdToPdf({
          content: combinedMarkdown,
          pdf_options: {
            format: 'A4',
            margin: '20mm',
            printBackground: true,
          },
        });

        fs.writeFileSync(pdfPath, content);

        console.log(`[${requestId}] Sending PDF file...`);

        return res.download(pdfPath, `${filePrefix}.pdf`, (err) => {
          if (err) {
            console.error(`[${requestId}] Download error:`, err);
          }
          cleanupFile(pdfPath);
        });
      } catch (pdfError) {
        console.error(`[${requestId}] PDF generation error:`, pdfError);

        // Fallback to markdown if PDF generation fails
        markdownPath = path.join(OUTPUT_DIR, `${filePrefix}.md`);
        fs.writeFileSync(markdownPath, combinedMarkdown);

        return res.download(markdownPath, `${filePrefix}.md`, (err) => {
          if (err) {
            console.error(`[${requestId}] Fallback download error:`, err);
          }
          cleanupFile(markdownPath);
        });
      }
    }
  } catch (error) {
    console.error(`[${requestId}] Controller error:`, error);

    // Clean up any generated files
    if (markdownPath) cleanupFile(markdownPath);
    if (pdfPath) cleanupFile(pdfPath);

    // Send detailed error in development, sanitized in production
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: isProduction ? undefined : error.stack,
    });
  } finally {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Request completed in ${duration}ms`);
    await NotesRequestModel.updateOne(
      { _id: reqLog._id },
      {
        status: 'completed',
        processing_time_ms: Date.now() - reqLog.createdAt,
        output_file: {
          filename: `${filePrefix}.pdf`,
        },
      }
    );
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
