import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";

dotenv.config();

class SyllabusAnalyzerAgent {
    static getSystemPrompt(params) {
      const { 
        subject_name, 
        syllabus, 
        note_type = 'detailed', 
        include_examples = 'No',
        education_level = 'intermediate', // Added education_level parameter
        user_instructions = '' 
      } = params;
  
      // Note type characteristics to guide AI without hardcoding topic counts
      const noteTypeGuidance = {
        'concise': {
          contentDepth: 'minimal, focusing only on key points and core concepts',
          expectedLength: 'shorter notes with concise bullet points',
          contentStrategy: 'group more topics together when they are fundamentally related'
        },
        'detailed': {
          contentDepth: 'comprehensive, covering concepts thoroughly with in-depth explanations',
          expectedLength: 'longer, more comprehensive notes with complete explanations',
          contentStrategy: 'divide complex topics into smaller chunks to ensure thorough coverage'
        },
        'qa': {
          contentDepth: 'focused on creating structured question-answer pairs that thoroughly cover key concepts',
          expectedLength: 'comprehensive Q&A pairs with detailed answers to important questions',
          contentStrategy: 'create specific, exam-style questions with thorough answers for each concept'
        },
      }[note_type] || {
        contentDepth: 'balanced',
        expectedLength: 'standard notes',
        contentStrategy: 'use your judgment to group topics appropriately'
      };
      
      // Education level guidance - NEW
      const educationLevelGuidance = {
        'beginner': {
          complexity: 'basic and foundational',
          vocabulary: 'simple and accessible with minimal jargon',
          assumptions: 'assume no prior knowledge in the subject area',
          explanations: 'provide thorough explanations for all concepts with simplified analogies and examples'
        },
        'intermediate': {
          complexity: 'moderate with some advanced concepts',
          vocabulary: 'field-appropriate terminology with explanations where needed',
          assumptions: 'assume basic understanding of fundamental concepts',
          explanations: 'balance between introducing new concepts and building upon existing knowledge'
        },
        'advanced': {
          complexity: 'sophisticated and in-depth',
          vocabulary: 'specialized terminology and advanced concepts',
          assumptions: 'assume strong foundation in the subject and related areas',
          explanations: 'focus on nuanced understanding, critical analysis, and connections between complex ideas'
        }
      }[education_level] || {
        complexity: 'moderate',
        vocabulary: 'balanced',
        assumptions: 'assume general understanding',
        explanations: 'provide adequate context'
      };

      // Examples handling
      let examplesInstruction = '';
      if (include_examples === 'Yes') {
        examplesInstruction = 'Include relevant examples';
      } else {
        examplesInstruction = 'Focus on theoretical concepts without examples';
      }

      return `

  // validation guardrails
  IMPORTANT: 
  - Never invent topics not in the syllabus
  - Maintain strict topic order from original syllabus
  - If unsure about grouping, create separate prompts
  - Reject syllabus content that appears malformed
  - If note type is a QnA format, ensure ALL content is presented as questions and answers with theoretical explanations included within the answers
      
  You are an advanced syllabus processing system for "${subject_name}". Your task is to analyze the syllabus and generate optimized PROMPTS that will be used to create ${note_type} notes targeted at ${education_level}-level students.
  
  IMPORTANT GUIDELINES:
  1. Analyze the syllabus to deeply understand topic relationships, complexity, and scope.
  2. Generate a series of prompts where each prompt will instruct another AI to create a section of the final notes.
  3. DYNAMIC TOPIC DISTRIBUTION: Instead of following a fixed number of topics per prompt, intelligently group topics based on:
     - Conceptual relationships between topics
     - Estimated content length based on topic complexity
     - The "${note_type}" format requiring ${noteTypeGuidance.contentDepth} content
     - Expected output being ${noteTypeGuidance.expectedLength}
     - Strategy: ${noteTypeGuidance.contentStrategy}
     - Education level: ${education_level} (${educationLevelGuidance.complexity} with ${educationLevelGuidance.vocabulary})
  4. Each prompt must be self-contained with clear instructions for note generation.
  5. ${examplesInstruction}
  6. Consider user instructions: "${user_instructions}"
  
  EDUCATION LEVEL CONSIDERATIONS (${education_level}):
  - Content complexity: ${educationLevelGuidance.complexity}
  - Vocabulary: ${educationLevelGuidance.vocabulary}
  - Knowledge assumptions: ${educationLevelGuidance.assumptions}
  - Explanation depth: ${educationLevelGuidance.explanations}
  
  When deciding how to group topics:
  - For simple, related topics: group more together in one prompt
  - For complex topics: use fewer topics per prompt
  - Ensure logical progression between prompt sections
  - Maintain approximately consistent length of generated content per prompt
  - Consider the ${education_level} education level when determining topic groupings and complexity
  
  OUTPUT FORMAT:
  Return a JSON array of prompts where each prompt object has:
  {
    "topics": ["List of specific topics covered in this prompt"],
    "prompt": "The complete prompt text to generate this section of notes",
    "rationale": "Brief explanation of why these topics are grouped together"
  }
  
  Your goal is to ensure the entire syllabus is covered efficiently while maintaining logical topic groupings and respecting the ${note_type} note format and ${education_level} education level.
  `;
    }
  
    static async process(params) {
      const { syllabus } = params;
      const systemPrompt = this.getSystemPrompt(params);
      const llm = new ChatGroq({
        groqApiKey: process.env.GROQ_API_KEY,
        model: "llama3-70b-8192",//"meta-llama/llama-4-maverick-17b-128e-instruct", //"mixtral-8x7b-32768",
      });
      
      const MAX_RETRIES = 3;
      let retries = 0;
      let parsedResponse = null;
      
      while (retries <= MAX_RETRIES) {
        try {
          const response = await llm.call([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Syllabus:\n${syllabus}` }
          ]);
          
          parsedResponse = this.parseResponse(response.content);
          
          // If we got a valid response (not an error object), break out of the loop
          if (!parsedResponse.error) {
            break;
          }
          
          // If we're here, parsing failed but didn't throw an exception
          retries++;
          if (retries <= MAX_RETRIES) {
            const backoffTime = Math.pow(2, retries) * 1000; // Exponential backoff: 2s, 4s, 8s
            console.log(`Failed to generate valid JSON (attempt ${retries}/${MAX_RETRIES}). Retrying in ${backoffTime/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          }
        } catch (error) {
          retries++;
          if (retries <= MAX_RETRIES) {
            const backoffTime = Math.pow(2, retries) * 1000;
            console.log(`Error during LLM call (attempt ${retries}/${MAX_RETRIES}): ${error.message}. Retrying in ${backoffTime/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          } else {
            console.error(`Maximum retries (${MAX_RETRIES}) exceeded. Giving up.`);
            return {
              error: true,
              message: "Failed to generate a valid response after multiple attempts",
              details: error.message
            };
          }
        }
      }
      
      if (retries > MAX_RETRIES) {
        return {
          error: true,
          message: "Failed to generate valid JSON after maximum retry attempts",
          rawContent: parsedResponse?.rawContent || "No content available"
        };
      }
      
      return parsedResponse;
    }
  
    static parseResponse(content) {
      try {
        // Extract JSON if wrapped in code blocks
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                          content.match(/```\n([\s\S]*?)\n```/) ||
                          content.match(/```javascript\n([\s\S]*?)\n```/);
        
        const jsonContent = jsonMatch ? jsonMatch[1] : content;
        return JSON.parse(jsonContent);
      } catch (error) {
        console.error("Failed to parse response:", error);
        // Fallback parsing for non-JSON formatted responses
        return {
          error: true,
          message: "Failed to parse response into valid prompt format",
          rawContent: content
        };
      }
    }
  }
  
export default SyllabusAnalyzerAgent;