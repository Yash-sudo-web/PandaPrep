import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';
import ModelClient from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import { broadcastMarkdownUpdate, broadcastStage } from '../websocket/server.js';
import ChatWithNotesAgent from './ChatWithNotesAgent.js';

dotenv.config();

const endpoint = process.env.AZURE_AI_ENDPOINT;
const modelName = process.env.AZURE_MODEL_NAME;
const apiKey = process.env.AZURE_API_KEY;

class NotesGeneratorAgent {
  static getSystemPrompt(params = {}) {
    const {
      note_type = 'detailed',
      include_examples = 'No',
      education_level = 'intermediate', // Added education_level parameter
      user_instructions = '',
    } = params;

    // Define formatting and content style based on note type
    const noteTypeConfig = {
      concise: {
        format: 'Use concise bullet points with minimal explanation',
        depth: 'Focus on core concepts and definitions only',
        length: 'Keep sections brief (150-250 words per major topic)',
        structure:
          '- Use ## for main topics\n- Use bullet points extensively\n- Minimize paragraph text',
      },
      detailed: {
        format: 'Use comprehensive paragraphs with thorough explanations',
        depth: 'Cover concepts in depth with supporting details',
        length: 'Provide substantial content (400-600 words per major topic)',
        structure:
          '- Use ## for main topics\n- Use ### for subtopics\n- Use bullet points for lists of features/characteristics\n- Use paragraphs for explanations',
      },
      qa: {
        format: 'Structure ALL content as clear questions followed by comprehensive answers',
        depth: 'Create questions that test understanding and provide detailed, explanatory answers',
        length:
          'Include 3-5 questions per topic with substantial answers (50-150 words per answer)',
        structure:
          '- Use ## for topic areas\n- Format EVERY concept as "**Q:** [Specific question about the concept]"\n- Follow IMMEDIATELY with a new line then "**A:** [Comprehensive answer with explanations]"\n- Ensure NO content appears outside this Q&A structure\n- Group related questions under appropriate headings',
      },
    }[note_type] || {
      format: 'Use a balanced approach with bullet points and explanations',
      depth: 'Cover main concepts with sufficient detail',
      length: 'Aim for medium length (300-500 words per major topic)',
      structure: '- Use ## for main topics\n- Use a mix of paragraphs and bullet points',
    };

    // Education level configuration - NEW
    const educationLevelConfig = {
      beginner: {
        complexity: 'Use simple language and explain all technical terms',
        assumptions: 'Assume no prior knowledge of the subject',
        explanations: 'Provide thorough explanations with everyday analogies',
        vocabulary: 'Use basic vocabulary with clear definitions for all technical terms',
        examples: 'Include very simple, concrete examples that relate to common experiences',
      },
      intermediate: {
        complexity: 'Use moderately technical language with some specialized terminology',
        assumptions: "Assume basic familiarity with the subject's fundamentals",
        explanations: 'Provide clear explanations that build on foundational knowledge',
        vocabulary: 'Use field-appropriate vocabulary with brief explanations for advanced terms',
        examples: 'Include practical examples that demonstrate application of concepts',
      },
      advanced: {
        complexity: 'Use sophisticated, technical language appropriate for specialists',
        assumptions: 'Assume strong prior knowledge of the subject and related areas',
        explanations: 'Focus on nuanced understanding and critical analysis',
        vocabulary: 'Use specialized terminology without explaining basic concepts',
        examples: 'Include complex, nuanced examples that illustrate advanced applications',
      },
    }[education_level] || {
      complexity: 'Use balanced language with appropriate technical terms',
      assumptions: 'Assume moderate familiarity with the subject',
      explanations: 'Provide clear explanations with appropriate depth',
      vocabulary: 'Use contextually appropriate vocabulary with explanations as needed',
      examples: 'Include helpful examples that clarify concepts',
    };

    // Example handling
    let examplesConfig = '';
    if (include_examples === 'Yes') {
      examplesConfig = `Include relevant examples to illustrate concepts. ${educationLevelConfig.examples}`;
    } else {
      examplesConfig = 'Focus on theoretical concepts without examples';
    }

    return `
  You are an expert educational content generator creating high-quality study notes. Your task is to generate ${note_type} notes targeted at ${education_level}-level students, following these specifications:
  
  CONTENT GUIDELINES:
  1. ${noteTypeConfig.format}
  2. ${noteTypeConfig.depth}
  3. ${examplesConfig}
  4. Highlight key definitions, theorems, and important concepts in **bold**
  5. Include relevant formulas with clear explanations where appropriate
  6. ${noteTypeConfig.length}
  7. Use clear, academic language accessible to ${education_level}-level students
  8. Address user-specific instructions: "${user_instructions}"
  9. If note type is a QnA format, ensure ALL content is presented as questions and answers with theoretical explanations included within the answers
  10. When reference material is provided, integrate it naturally into your notes while ensuring accuracy and relevance
  11. dont provide any additional commentary or introduction, just the notes content

  EDUCATION LEVEL GUIDELINES (${education_level}):
  1. Content complexity: ${educationLevelConfig.complexity}
  2. Knowledge assumptions: ${educationLevelConfig.assumptions}
  3. Explanation depth: ${educationLevelConfig.explanations}
  4. Vocabulary usage: ${educationLevelConfig.vocabulary}
  
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
  
  Your output should be comprehensive, well-structured study material at the ${education_level} level that directly addresses the topics provided. Generate ONLY the final notes content, properly formatted in markdown.
  `;
  }

  static async retrieveSectionContext(sectionTopic, params) {
    if (!params.vectorStorePath || !params.documentId) {
      return '';
    }

    try {
      const contextQuery =
        `${sectionTopic} ${params.subject_name || ''} explanation examples`.trim();

      // Load the vector store directly using the imported function
      const vectorStore = await ChatWithNotesAgent.loadVectorStore(params.vectorStorePath);

      // Retrieve context directly using the imported function
      const context = await ChatWithNotesAgent.retrieveContext(vectorStore, contextQuery, 3);

      if (context && context.trim().length > 0) {
        return `\n\nRELEVANT REFERENCE MATERIAL:\n${context}\n\n`;
      }
    } catch (error) {
      console.warn(`Failed to retrieve context for section "${sectionTopic}":`, error.message);
    }

    return '';
  }

  static async generate(prompt, params = {}, requestId = null) {
    const noteType = params.note_type || 'detailed';
    const promptText =
      typeof prompt === 'string' ? prompt : prompt.prompt || JSON.stringify(prompt);

    // Extract section topic for context retrieval - use entire JSON object as string
    let sectionTopic = '';
    if (typeof prompt === 'object') {
      sectionTopic = JSON.stringify(prompt);
    } else if (typeof prompt === 'string') {
      sectionTopic = prompt;
    }

    // Retrieve context if vector store is available
    let sectionContext = '';
    console.log(`Retrieving context for section: "${sectionTopic}" with params:`, params);
    if (params.vectorStorePath && params.documentId && sectionTopic) {
      sectionContext = await this.retrieveSectionContext(sectionTopic, params);
    }

    // Combine prompt with context
    const enhancedPrompt = promptText + sectionContext;
    const systemPrompt = this.getSystemPrompt(params);

    if (requestId) {
      broadcastStage(requestId, 'notes_generation_started', {
        promptLength: enhancedPrompt.length,
        hasContext: sectionContext.length > 0,
      });
    }

    let content = '';
    let model = '';
    let source = '';

    if (noteType === 'detailed') {
      // Use Azure
      const azureClient = new ModelClient(
        endpoint,
        new AzureKeyCredential(process.env.AZURE_API_KEY)
      );

      const response = await azureClient.path('/chat/completions').post({
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: enhancedPrompt },
          ],
          max_tokens: 2048,
          temperature: 0.8,
          top_p: 0.1,
          presence_penalty: 0,
          frequency_penalty: 0,
          model: modelName,
        },
      });

      console.log('Response generated successfully', response);

      if (response.status !== '200') {
        throw response.body.error;
      }

      content = response.body.choices[0].message.content;
      model = modelName;
      source = 'Azure';

      if (requestId) {
        broadcastMarkdownUpdate(requestId, content, null, true);
      }
    } else {
      // Use Groq
      const llm = new ChatGroq({
        groqApiKey: process.env.GROQ_API_KEY,
        model: 'llama3-70b-8192',
        streaming: true,
      });

      model = 'llama3-70b-8192';
      source = 'Groq';
      let accumulatedContent = '';

      const response = await llm.invoke(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: enhancedPrompt },
        ],
        {
          callbacks: requestId
            ? [
                {
                  handleLLMNewToken(token) {
                    accumulatedContent += token;
                    if (token.includes('\n\n') || accumulatedContent.length % 20 === 0) {
                      broadcastMarkdownUpdate(requestId, accumulatedContent, null, false);
                    }
                  },
                },
              ]
            : undefined,
        }
      );

      content = response.content;

      if (requestId) {
        broadcastMarkdownUpdate(requestId, content, null, true);
      }
    }

    console.log(
      `[Model Used] Source: ${source}, Model: ${model}, Context: ${sectionContext.length > 0 ? 'Yes' : 'No'}`
    );
    return this.formatResponse(content);
  }

  static formatResponse(content) {
    // Clean up markdown if necessary
    let cleanedContent = content;

    // Remove markdown code block indicators if present
    if (content.startsWith('```markdown') || content.startsWith('```md')) {
      cleanedContent = content.replace(/^```(markdown|md)\n/, '').replace(/\n```$/, '');
    } else if (content.startsWith('```') && content.endsWith('```')) {
      cleanedContent = content.replace(/^```\n/, '').replace(/\n```$/, '');
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
        topics: prompts.map((p) => p.topics || []),
        hasVectorStore: !!(params.vectorStorePath && params.documentId),
      });
    }

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const currentTopics = prompt.topics || [];

      if (requestId) {
        broadcastStage(requestId, 'generating_section', {
          sectionIndex: i,
          sectionNumber: i + 1,
          totalSections: totalPrompts,
          topics: currentTopics,
          progress: Math.round((i / totalPrompts) * 100),
        });
      }

      // Generate notes with context for this specific section
      const content = await this.generate(prompt, params, requestId);

      if (requestId) {
        broadcastStage(requestId, 'section_completed', {
          sectionIndex: i,
          sectionNumber: i + 1,
          totalSections: totalPrompts,
          topics: currentTopics,
          progress: Math.round(((i + 1) / totalPrompts) * 100),
        });
      }

      results.push({
        topics: currentTopics,
        content: content,
        promptUsed: prompt.prompt || 'Custom prompt',
      });
    }

    if (requestId) {
      broadcastStage(requestId, 'all_sections_completed', {
        totalSections: totalPrompts,
        progress: 100,
      });
    }

    return results;
  }

  static combineNotes(notesArray, requestId = null) {
    // Combine multiple notes sections into a single document
    if (requestId) {
      broadcastStage(requestId, 'combining_sections', {
        totalSections: notesArray.length,
      });
    }

    let combinedNotes = '# Complete Study Notes\n\n';
    let tableOfContents = '## Table of Contents\n\n';

    notesArray.forEach((noteSection, index) => {
      // Add to table of contents
      const topicsList = noteSection.topics.join(', ');
      tableOfContents += `${index + 1}. [${topicsList}](#section-${index + 1})\n`;

      // Add section with anchor
      combinedNotes += `\n<a id="section-${index + 1}"></a>\n\n`;
      combinedNotes += noteSection.content + '\n\n---\n\n';

      // Broadcast progress updates on table of contents
      if (requestId && index % 2 === 0) {
        broadcastMarkdownUpdate(requestId, tableOfContents, -1, false);
      }
    });

    const finalDocument = tableOfContents + '\n\n---\n\n' + combinedNotes;

    if (requestId) {
      broadcastMarkdownUpdate(requestId, finalDocument, -1, true);
      broadcastStage(requestId, 'document_combined', { success: true });
    }
    return finalDocument;
  }
}

export default NotesGeneratorAgent;
