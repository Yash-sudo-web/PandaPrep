import ChatWithNotesAgent from '../agents/ChatWithNotesAgent.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Constants
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(process.cwd(), "uploads", "pdfs");
const VECTOR_STORE_DIR = path.join(process.cwd(), "temp", "vectorstores");

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(VECTOR_STORE_DIR)) {
  fs.mkdirSync(VECTOR_STORE_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept PDFs only
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * Controller to upload and process a PDF document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadPdfController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    // Generate a unique document ID
    const documentId = `doc-${uuidv4()}`;
    const pdfPath = req.file.path;
    
    // Process the PDF document to create vector store
    const vectorStorePath = await ChatWithNotesAgent.processPdfDocument(pdfPath, documentId);
    
    return res.status(200).json({
      success: true,
      message: 'PDF processed successfully',
      data: {
        documentId,
        vectorStorePath,
        originalFilename: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Error in uploadPdfController:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process PDF',
      error: error.message
    });
  }
};

/**
 * Controller to chat with a processed PDF document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const chatWithPdfController = async (req, res) => {
  try {
    const { documentId, query, options } = req.body;
    
    if (!documentId || !query) {
      return res.status(400).json({
        success: false,
        message: 'documentId and query are required'
      });
    }
    
    // Construct vector store path from document ID
    const vectorStorePath = path.join(VECTOR_STORE_DIR, documentId);
    
    // Check if vector store exists
    if (!fs.existsSync(vectorStorePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document not found. Please upload and process the PDF first.'
      });
    }
    
    // Process the chat query
    const result = await ChatWithNotesAgent.process({
      vectorStorePath,
      documentId,
      query,
      options: options || {}
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to process query',
        error: result.error
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        query: result.query,
        response: result.response,
        relevantContextCount: result.relevantContextCount
      }
    });
  } catch (error) {
    console.error('Error in chatWithPdfController:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process query',
      error: error.message
    });
  }
};

/**
 * Controller to handle streaming chat with PDF
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const streamChatWithPdfController = async (req, res) => {
  try {
    const { documentId, query, options } = req.body;
    
    if (!documentId || !query) {
      return res.status(400).json({
        success: false,
        message: 'documentId and query are required'
      });
    }
    
    // Construct vector store path from document ID
    const vectorStorePath = path.join(VECTOR_STORE_DIR, documentId);
    
    // Check if vector store exists
    if (!fs.existsSync(vectorStorePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document not found. Please upload and process the PDF first.'
      });
    }
    
    // Set headers for SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Define stream callback function
    const streamCallback = (chunk, fullResponse) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    };
    
    // Process the streaming chat query
    const result = await ChatWithNotesAgent.process({
      vectorStorePath,
      documentId,
      query,
      streaming: true,
      streamCallback,
      options: options || {}
    });
    
    // Send completion event
    res.write(`data: ${JSON.stringify({ 
      done: true, 
      relevantContextCount: result.relevantContextCount 
    })}\n\n`);
    
    res.end();
  } catch (error) {
    console.error('Error in streamChatWithPdfController:', error);
    // Send error in SSE format
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};