import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";
import { broadcastMarkdownUpdate, broadcastStage } from '../websocket/server.js';

dotenv.config();

class NotesGeneratorAgent {
  static getSystemPrompt(params = {}) {
    const { 
      note_type = 'detailed',
      include_examples = 'No',
      user_instructions = ''
    } = params;
  
    // Define formatting and content style based on note type
    const noteTypeConfig = {
      'concise': {
        format: 'Use concise bullet points with minimal explanation',
        depth: 'Focus on core concepts and definitions only',
        length: 'Keep sections brief (150-250 words per major topic)',
        structure: '- Use ## for main topics\n- Use bullet points extensively\n- Minimize paragraph text'
      },
      'detailed': {
        format: 'Use comprehensive paragraphs with thorough explanations',
        depth: 'Cover concepts in depth with supporting details',
        length: 'Provide substantial content (400-600 words per major topic)',
        structure: '- Use ## for main topics\n- Use ### for subtopics\n- Use bullet points for lists of features/characteristics\n- Use paragraphs for explanations'
      },
      'qa': {
        format: 'Structure ALL content as clear questions followed by comprehensive answers',
        depth: 'Create questions that test understanding and provide detailed, explanatory answers',
        length: 'Include 3-5 questions per topic with substantial answers (50-150 words per answer)',
        structure: '- Use ## for topic areas\n- Format EVERY concept as "**Q:** [Specific question about the concept]"\n- Follow IMMEDIATELY with a new line then "**A:** [Comprehensive answer with explanations]"\n- Ensure NO content appears outside this Q&A structure\n- Group related questions under appropriate headings'
      },  
    }[note_type] || {
      format: 'Use a balanced approach with bullet points and explanations',
      depth: 'Cover main concepts with sufficient detail',
      length: 'Aim for medium length (300-500 words per major topic)',
      structure: '- Use ## for main topics\n- Use a mix of paragraphs and bullet points'
    };
  
    // Example handling
    let examplesConfig = '';
    if (include_examples === 'Yes') {
      examplesConfig = 'Include relevant examples to illustrate concepts';
    } else {
      examplesConfig = 'Focus on theoretical concepts without examples';
    }
  
    return `
  You are an expert educational content generator creating high-quality study notes. Your task is to generate ${note_type} notes following these specifications:
  
  CONTENT GUIDELINES:
  1. ${noteTypeConfig.format}
  2. ${noteTypeConfig.depth}
  3. ${examplesConfig}
  4. Highlight key definitions, theorems, and important concepts in **bold**
  5. Include relevant formulas with clear explanations where appropriate
  6. ${noteTypeConfig.length}
  7. Use clear, academic language accessible to students
  8. Address user-specific instructions: "${user_instructions}"
  9. If note type is a QnA format, ensure ALL content is presented as questions and answers with theoretical explanations included within the answers
  
  FORMATTING INSTRUCTIONS:
  1. Use proper markdown formatting throughout
  2. Structure content following this hierarchy:
     ${noteTypeConfig.structure}
  3. When writing mathematical formulas, follow these STRICT GUIDELINES:
     - Use single dollar signs for inline formulas: $formula$
     - Use double dollar signs for display equations: $$formula$$
     - AVOID using LaTeX text commands like \\text{} when possible
     - For fractions, use \\frac{numerator}{denominator}
     - Use simple math operators: +, -, ×, ÷, =, <, >, ≤, ≥
     - For superscripts use ^ and for subscripts use _ 
     - For multiple character superscripts/subscripts, use curly braces: x_{123}
     - Keep formulas as simple as possible while preserving meaning
     - NEVER include backticks or markdown code formatting around LaTeX formulas
     - NEVER write the word "LaTeX" or explain that you're using LaTeX - just write the formulas
     - For simple symbols like α, β, γ use the direct Unicode characters when possible
     - For complex operations and environments use standard LaTeX notation
     - For integrals use \\int_{lower}^{upper} expression
     - For sums use \\sum_{lower}^{upper} expression
     - For limits use \\lim_{x \\to value} expression
  4. Use tables for comparative information when useful
  5. Make sure headings follow a logical hierarchy
  
  Your output should be comprehensive, well-structured study material that directly addresses the topics provided. Generate ONLY the final notes content, properly formatted in markdown.
  `;
  }
  
    static async generate(prompt, params = {}, requestId = null) {
      // If prompt is a string, use it directly
      // If it's an object from SyllabusAnalyzerAgent, extract the prompt text
      const promptText = typeof prompt === 'string' 
        ? prompt 
        : (prompt.prompt || JSON.stringify(prompt));
      
      const systemPrompt = this.getSystemPrompt(params);
      
      if (requestId) {
        broadcastStage(requestId, 'notes_generation_started', { 
          promptLength: promptText.length 
        });
      }
      
      const llm = new ChatGroq({
        groqApiKey: process.env.GROQ_API_KEY,
        model:"meta-llama/llama-4-maverick-17b-128e-instruct", 
        streaming: true, // Enable streaming
      });
      
      let accumulatedContent = '';
      
      const response = await llm.call([
        { role: "system", content: systemPrompt },
        { role: "user", content: promptText }
      ], {
        callbacks: requestId ? [{
          handleLLMNewToken(token) {
            // Accumulate tokens and broadcast updates
            accumulatedContent += token;
            
            // Only broadcast every 20 characters to avoid overwhelming the connection
            // or when we hit a paragraph break
            if (token.includes('\n\n') || accumulatedContent.length % 20 === 0) {
              broadcastMarkdownUpdate(requestId, accumulatedContent, null, false);
            }
          }
        }] : undefined
      });
      
      // Send final update with complete content
      if (requestId) {
        broadcastMarkdownUpdate(requestId, response.content, null, true);
      }
      
      return this.formatResponse(response.content);
    }
  
    static formatResponse(content) {
      // Clean up markdown if necessary
      let cleanedContent = content;
      
      // Remove markdown code block indicators if present
      if (content.startsWith('```markdown') || content.startsWith('```md')) {
        cleanedContent = content
          .replace(/^```(markdown|md)\n/, '')
          .replace(/\n```$/, '');
      } else if (content.startsWith('```') && content.endsWith('```')) {
        cleanedContent = content
          .replace(/^```\n/, '')
          .replace(/\n```$/, '');
      }
      
      return cleanedContent;
    }
  
    static async generateMultipleNotes(prompts, params = {}, requestId = null) {
      // Process an array of prompts from SyllabusAnalyzerAgent
      const results = [];
      const totalPrompts = prompts.length;
      
      if (requestId) {
        broadcastStage(requestId, 'notes_generation_overview', { 
          totalSections: totalPrompts,
          topics: prompts.map(p => p.topics || []) 
        });
      }
      
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        
        if (requestId) {
          broadcastStage(requestId, 'generating_section', { 
            sectionIndex: i,
            sectionNumber: i + 1,
            totalSections: totalPrompts,
            topics: prompt.topics || [],
            progress: Math.round((i / totalPrompts) * 100)
          });
        }
        
        const content = await this.generate(prompt, params, requestId);
        
        if (requestId) {
          broadcastStage(requestId, 'section_completed', { 
            sectionIndex: i,
            sectionNumber: i + 1,
            totalSections: totalPrompts,
            topics: prompt.topics || [],
            progress: Math.round(((i + 1) / totalPrompts) * 100)
          });
        }
        
        results.push({
          topics: prompt.topics || [],
          content: content,
          promptUsed: prompt.prompt || "Custom prompt"
        });
      }
      
      if (requestId) {
        broadcastStage(requestId, 'all_sections_completed', { 
          totalSections: totalPrompts,
          progress: 100
        });
      }
      
      return results;
    }
  
    static combineNotes(notesArray, requestId = null) {
      // Combine multiple notes sections into a single document
      if (requestId) {
        broadcastStage(requestId, 'combining_sections', { 
          totalSections: notesArray.length 
        });
      }
      
      let combinedNotes = "# Complete Study Notes\n\n";
      let tableOfContents = "## Table of Contents\n\n";
      
      notesArray.forEach((noteSection, index) => {
        // Add to table of contents
        const topicsList = noteSection.topics.join(", ");
        tableOfContents += `${index + 1}. [${topicsList}](#section-${index + 1})\n`;
        
        // Add section with anchor
        combinedNotes += `\n<a id="section-${index + 1}"></a>\n\n`;
        combinedNotes += noteSection.content + "\n\n---\n\n";
        
        // Broadcast progress updates on table of contents
        if (requestId && index % 2 === 0) {
          broadcastMarkdownUpdate(requestId, tableOfContents, -1, false);
        }
      });
      
      const finalDocument = tableOfContents + "\n\n---\n\n" + combinedNotes;
      
      if (requestId) {
        broadcastMarkdownUpdate(requestId, finalDocument, -1, true);
        broadcastStage(requestId, 'document_combined', { success: true });
      }
      return finalDocument;
    }
  }
  
  export default NotesGeneratorAgent;