// File: controllers/pipeline.controller.js
import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { mdToPdf } from 'md-to-pdf';
import NotesGeneratorAgent from '../agents/NotesGeneratorAgent.js';
import SyllabusAnalyzerAgent from '../agents/SyllabusAnalyzerAgent.js';
import ImageSuggestionAgent from '../agents/ImageSuggestionAgent.js';
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

  if (body.include_images && !['Yes', 'No'].includes(body.include_images)) {
    errors.push("include_images must be 'Yes' or 'No'");
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
 * Recursively copy a directory
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
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
  let format = 'pdf';
  let pdfPath = null;
  let reqLog = null;
  let filePrefix = DEFAULT_FILENAME;
  let imageResults = [];

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
      include_images = 'No',
      user_instructions = '',
       // 'pdf' or 'markdown'
    } = req.body;
    format = req.body.format || 'pdf';
    
    console.log(`[${requestId}] Generating ${note_type} notes for ${subject_name}`);

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

    // Store request in database
    reqLog = await NotesRequestModel.create({
      request_id: requestId,
      subject_name,
      syllabus,
      note_type,
      include_examples,
      example_types,
      include_images,
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

    // Step 3: Handle image suggestions and integration if enabled
    let combinedMarkdown = '';
    if (include_images === 'Yes') {
      console.log(`[${requestId}] Generating image suggestions...`);
      const imageSuggestions = await ImageSuggestionAgent.generateImageSuggestions(notesResults);
      
      console.log(`[${requestId}] Finding and downloading images...`);
      imageResults = await ImageSuggestionAgent.findAndDownloadImages(imageSuggestions);
      
      // Combine notes first
      combinedMarkdown = NotesGeneratorAgent.combineNotes(notesResults);
      
      // Then integrate images
      console.log(`[${requestId}] Integrating ${imageResults.filter(img => img.success).length} images into notes...`);
      combinedMarkdown = ImageSuggestionAgent.integrateImagesIntoMarkdown(combinedMarkdown, imageResults);
    } else {
      // Just combine notes without images
      combinedMarkdown = NotesGeneratorAgent.combineNotes(notesResults);
    }

    // Prepare filename
    const sanitizedSubject = subject_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    console.log(`[${requestId}] Sanitized subject name: ${sanitizedSubject}`);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    filePrefix = `${sanitizedSubject}_${note_type}_${timestamp}`;
    console.log(`[${requestId}] File prefix: ${filePrefix}`);

    // Create a dedicated output directory for this request to keep images with the document
    const requestOutputDir = path.join(OUTPUT_DIR, requestId);
    if (!fs.existsSync(requestOutputDir)) {
      fs.mkdirSync(requestOutputDir, { recursive: true });
    }

    // Step 4: Save and deliver content based on requested format
    if (format.toLowerCase() === 'markdown') {
      // Save markdown to the request-specific directory
      markdownPath = path.join(requestOutputDir, `${filePrefix}.md`);
      fs.writeFileSync(markdownPath, combinedMarkdown);
      
      // If using images, create an images directory and copy the images
      if (include_images === 'Yes' && imageResults.some(img => img.success)) {
        const imagesDir = path.join(requestOutputDir, 'images');
        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true });
        }
        
        // Update image paths in markdown and copy images
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
      
      // Create a zip file containing all content
      const archiver = require('archiver');
      const zipPath = path.join(OUTPUT_DIR, `${filePrefix}.zip`);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', function() {
        console.log(`[${requestId}] Zip archive created: ${zipPath} (${archive.pointer()} bytes)`);
        
        // Send the zip file
        res.download(zipPath, `${filePrefix}.zip`, (err) => {
          if (err) {
            console.error(`[${requestId}] Download error:`, err);
          }
          
          // Clean up the zip file after download
          cleanupFile(zipPath);
          
          // Keep the request directory for a while (could be cleaned up by a cron job later)
        });
      });
      
      archive.on('error', function(err) {
        console.error(`[${requestId}] Zip creation error:`, err);
        
        // Fallback to just the markdown file if zip fails
        res.download(markdownPath, `${filePrefix}.md`, (err) => {
          if (err) {
            console.error(`[${requestId}] Fallback download error:`, err);
          }
        });
      });
      
      archive.pipe(output);
      
      // Add the entire request directory to the zip
      archive.directory(requestOutputDir, false);
      
      // Finalize the archive
      archive.finalize();
    } else {
      // Generate PDF
      console.log(`[${requestId}] Converting to PDF...`);
      
      // Save the markdown file first
      markdownPath = path.join(requestOutputDir, `${filePrefix}.md`);
      fs.writeFileSync(markdownPath, combinedMarkdown);
      
      // If using images, create an images directory and copy the images
      if (include_images === 'Yes' && imageResults.some(img => img.success)) {
        const imagesDir = path.join(requestOutputDir, 'images');
        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true });
        }
        
        // Update image paths in markdown and copy images
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
      
      pdfPath = path.join(requestOutputDir, `${filePrefix}.pdf`);
      
      try {
        // Setup PDF generation with relative path support for images
        const { content } = await mdToPdf({
          path: markdownPath,
          pdf_options: {
            format: 'A4',
            margin: '20mm',
            printBackground: true,
          },
          launch_options: {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          }
        });
        
        fs.writeFileSync(pdfPath, content);
        
        console.log(`[${requestId}] Sending PDF file...`);
        
        return res.download(pdfPath, `${filePrefix}.pdf`, (err) => {
          if (err) {
            console.error(`[${requestId}] Download error:`, err);
          }
          
          // We keep the request directory for potential later retrieval
          // A separate cleanup cron job should handle old directories
        });
      } catch (pdfError) {
        console.error(`[${requestId}] PDF generation error:`, pdfError);
        
        // Fallback to creating a zip of the markdown and images
        const archiver = require('archiver');
        const zipPath = path.join(OUTPUT_DIR, `${filePrefix}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', function() {
          console.log(`[${requestId}] Fallback zip archive created: ${zipPath}`);
          
          return res.download(zipPath, `${filePrefix}.zip`, (err) => {
            if (err) {
              console.error(`[${requestId}] Fallback download error:`, err);
            }
            cleanupFile(zipPath);
          });
        });
        
        archive.on('error', function(err) {
          console.error(`[${requestId}] Fallback zip creation error:`, err);
          
          // Double fallback to just the markdown file
          return res.download(markdownPath, `${filePrefix}.md`, (err) => {
            if (err) {
              console.error(`[${requestId}] Double fallback download error:`, err);
            }
          });
        });
        
        archive.pipe(output);
        archive.directory(requestOutputDir, false);
        archive.finalize();
      }
    }
  } catch (error) {
    console.error(`[${requestId}] Controller error:`, error);
    
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
    
    // Update request log
    const successfulImages = imageResults.filter(img => img.success).length;
    await NotesRequestModel.updateOne(
      { _id: reqLog._id },
      {
        status: 'completed',
        processing_time_ms: Date.now() - startTime,
        output_file: {
          filename: `${filePrefix}.${format.toLowerCase() === 'markdown' ? 'zip' : 'pdf'}`,
          directory: requestId
        },
        image_count: successfulImages
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