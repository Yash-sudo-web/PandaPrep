import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
import fs from "fs";

dotenv.config({ path: "./.env" });

console.log("API Key Loaded:", process.env.GROQ_API_KEY);

const llm = new ChatGroq({
  groqApiKey: process.env.GROQ_API_KEY,
  model: "mixtral-8x7b-32768",
});

async function generateStructuredPrompts(syllabus) {
    const llmPrompt = `
        You are a professional syllabus simplifier. Your task is to break down the given syllabus into multiple structured prompts. 
        Each prompt should focus on a specific part of the syllabus, ensuring completeness and logical flow.

        Format your response as a **valid JSON array** with clear, detailed prompts.

        Example output:
        [
        "Explain Topic A in depth...",
        "Provide key points for Topic B...",
        "Summarize Topic C with examples..."
        ]

        Here is the syllabus:
        ${syllabus}

        Return ONLY a valid JSON array, nothing else.
    `;

  try {
    const response = await llm.call([llmPrompt]);
    console.log("LLM Raw Response:", response.content);
    return JSON.parse(response.content);
  } catch (error) {
    console.error("Error parsing response:", error);
    return [];
  }
}

async function generateNotesFromPrompts(prompts) {
    const systemPrompt1 = `
        You are an expert educational content generator. Your task is to generate comprehensive, well-structured, and detailed notes based on the given prompts.
        Ensure clarity, conciseness, and logical flow.
        Format the response as a valid JSON object where keys are the prompts and values are the corresponding detailed notes.

        Example output:
        {
        "Explain Topic A in depth...": "Detailed explanation of Topic A...",
        "Provide key points for Topic B...": "Key points for Topic B are..."
        }

        Here are the prompts:
        ${JSON.stringify(prompts)}

        Return ONLY a valid JSON object, nothing else.
    `;
    const systemPrompt2 = `
        You are an AI specializing in generating clear, concise, and informative study notes from structured prompts. Your task is to create well-organized notes that explain key concepts in a simple yet comprehensive manner. Ensure that the notes:

        Provide clear definitions and explanations.
        Include relevant examples where necessary.
        Use bullet points, subheadings, and structured formatting for readability.
        Maintain a professional and academic tone, while being engaging and easy to understand.
        Your goal is to make complex topics accessible and digestible for learners, helping them grasp key ideas effectively."

        Example output:
        {
        "Explain Topic A in depth...": "Detailed explanation of Topic A...",
        "Provide key points for Topic B...": "Key points for Topic B are..."
        }

        Here are the prompts:
        ${JSON.stringify(prompts)}

        Return ONLY a valid JSON object, nothing else.
    `;

  try {
    const response = await llm.call([systemPrompt2]);
    console.log("LLM Notes Response:", response.content);
    return JSON.parse(response.content);
  } catch (error) {
    console.error("Error parsing notes response:", error);
    return {};
  }
}

function generatePDF(notes, filePath = "output.pdf") {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
  
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
  
      // Title
      doc.fontSize(20).text("Generated Study Notes", { align: "center" });
      doc.moveDown(2);
  
      // Loop through the notes and add them to the PDF
      for (const [topic, content] of Object.entries(notes)) {
        doc.fontSize(16).text(topic, { underline: true });
        doc.moveDown(0.5);
  
        if (typeof content === "object") {
          for (const [key, value] of Object.entries(content)) {
            doc.fontSize(14).text(`${key}:`, { bold: true });
            if (Array.isArray(value)) {
              value.forEach((item) => doc.fontSize(12).text(`- ${item}`));
            } else {
              doc.fontSize(12).text(value);
            }
            doc.moveDown(0.5);
          }
        } else {
          doc.fontSize(12).text(content);
        }
        doc.moveDown(1);
      }
  
      doc.end();
  
      stream.on("finish", () => resolve(filePath));
      stream.on("error", (err) => reject(err));
    });
  }

  export async function generateNotesController(req, res) {
    try {
      const { syllabus } = req.body;
      if (!syllabus) {
        return res.status(400).json({ error: "Syllabus is required" });
      }
  
      // Step 1: Generate structured prompts
      const structuredPrompts = await generateStructuredPrompts(syllabus);
  
      // Step 2: Generate notes from structured prompts
      const notes = await generateNotesFromPrompts(structuredPrompts);
  
      // Step 3: Generate PDF
      const pdfPath = "study_notes.pdf";
      await generatePDF(notes, pdfPath);
  
      res.download(pdfPath, "study_notes.pdf", (err) => {
        if (err) {
          console.error("Error sending PDF:", err);
          res.status(500).json({ error: "Error generating PDF" });
        }
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
