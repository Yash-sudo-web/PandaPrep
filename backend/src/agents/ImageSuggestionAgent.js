import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";
import axios from "axios";
import { JSDOM } from "jsdom";
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from "console";

dotenv.config();

// Constants
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_CACHE_DIR = path.join(process.cwd(), 'temp', 'images');

// Ensure image cache directory exists
if (!fs.existsSync(IMAGE_CACHE_DIR)) {
  fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
}

class ImageSuggestionAgent {
  static getSystemPrompt() {
    return `
You are an expert educational image suggestion system. Your task is to analyze the topics and suggest appropriate images that would enhance understanding of the educational content.

For each topic provided:
1. Identify 1-2 key concepts that would benefit from visual representation
2. Suggest specific image search terms that would yield helpful, educational diagrams or illustrations
3. Prioritize diagrams, charts, and educational illustrations over photographs when appropriate
4. For STEM topics, focus on technical diagrams, charts, or visual representations of concepts
5. For humanities, focus on relevant historical images, conceptual diagrams, or visual examples

Your suggestions should be specific enough to find quality educational images but generic enough to have multiple good results. Avoid suggesting copyrighted images from specific textbooks.

OUTPUT FORMAT:
Return a JSON array where each object contains:
{
  "topic": "The specific topic or concept",
  "searchTerms": ["2-3 specific search terms for images"],
  "description": "Brief description of what the image should illustrate",
  "placement": "suggestion for where in the notes this image belongs (e.g., 'After introduction', 'Before examples')"
}
`;
  }

  static async generateImageSuggestions(notesSections) {

    try {
      // Extract topics from notes sections
      const topics = notesSections.flatMap(section => section.topics);
      
      const llm = new ChatGroq({
        groqApiKey: process.env.GROQ_API_KEY,
        model: "llama-3.3-70b-versatile", //mixtral-8x7b-32768
      });
      
      console.log("Generating image suggestions for topics:", topics.join(", "));
      
      const response = await llm.call([
        { role: "system", content: this.getSystemPrompt() },
        { role: "user", content: `Please suggest appropriate educational images for the following topics in my study notes: ${topics.join(", ")}` }
      ]);
      
      return this.parseResponse(response.content);
    } catch (error) {
      console.error("Error generating image suggestions:", error);
      return [];
    }
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
      console.error("Failed to parse image suggestions response:", error);
      return [];
    }
  }

  static async findAndDownloadImages(suggestions) {
    const results = [];
    console.log("Processing image suggestions:", suggestions);
    
    for (const suggestion of suggestions) {
      try {
        // Use only the first search term for simplicity
        const searchTerm = suggestion.searchTerms[0];
        const imageUrl = await this.searchForImage(searchTerm);
        
        if (imageUrl) {
          const localPath = await this.downloadImage(imageUrl, searchTerm);
          if (localPath) {
            results.push({
              topic: suggestion.topic,
              description: suggestion.description,
              placement: suggestion.placement,
              searchTerm: searchTerm,
              localPath: localPath,
              success: true
            });
            continue;
          }
        }
        
        // If we get here, we couldn't get an image for the first search term
        // Try the second search term if available
        if (suggestion.searchTerms.length > 1) {
          const backupSearchTerm = suggestion.searchTerms[1];
          const backupImageUrl = await this.searchForImage(backupSearchTerm);
          
          if (backupImageUrl) {
            const localPath = await this.downloadImage(backupImageUrl, backupSearchTerm);
            if (localPath) {
              results.push({
                topic: suggestion.topic,
                description: suggestion.description,
                placement: suggestion.placement,
                searchTerm: backupSearchTerm,
                localPath: localPath,
                success: true
              });
              continue;
            }
          }
        }
        
        // If we get here, we couldn't find any image
        results.push({
          topic: suggestion.topic,
          description: suggestion.description,
          placement: suggestion.placement,
          searchTerm: suggestion.searchTerms.join(", "),
          success: false,
          error: "No suitable image found"
        });
      } catch (error) {
        console.error(`Error processing image for ${suggestion.topic}:`, error);
        results.push({
          topic: suggestion.topic,
          searchTerm: suggestion.searchTerms.join(", "),
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  static async searchForImage(searchTerm) {
    try {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      
      // Encode the search term for URL
      const encodedSearchTerm = encodeURIComponent(`${searchTerm} `);
      const searchUrl = `https://www.google.com/search?q=${encodedSearchTerm}&tbm=isch`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0'
        }
      });
      
      // Parse HTML content
      const dom = new JSDOM(response.data);
      const imgElements = dom.window.document.querySelectorAll('img');
      
      // Filter out small images and icons, skip the first which is usually the Google logo
      const imageUrls = Array.from(imgElements)
        .slice(1) // Skip the first image (usually Google logo)
        .filter(img => {
          const src = img.getAttribute('src');
          return src && src.startsWith('http') && !src.includes('gstatic.com');
        })
        .map(img => img.getAttribute('src'));
      
      // Return the first valid image URL if available
      return imageUrls.length > 0 ? imageUrls[0] : null;
    } catch (error) {
      console.error(`Error searching for image "${searchTerm}":`, error.message);
      return null;
    }
  }

  static async downloadImage(imageUrl, searchTerm) {
    try {
      // Sanitize the search term for use in filename
      const sanitizedSearchTerm = searchTerm.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileExt = this.getFileExtension(imageUrl);
      const fileName = `${sanitizedSearchTerm}_${uuidv4().substring(0, 8)}${fileExt}`;
      const filePath = path.join(IMAGE_CACHE_DIR, fileName);
      
      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'stream',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // Save the image to disk
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error(`Error downloading image from "${imageUrl}":`, error.message);
      return null;
    }
  }

  static getFileExtension(url) {
    // Try to extract extension from URL
    const urlPath = new URL(url).pathname;
    const extMatch = urlPath.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
    
    if (extMatch) {
      return `.${extMatch[1].toLowerCase()}`;
    }
    
    // Default to .jpg if extension not found
    return '.jpg';
  }

  static integrateImagesIntoMarkdown(markdown, imageResults) {
    let enhancedMarkdown = markdown;
    
    // Sort image results by topic to ensure consistent processing
    const sortedImageResults = [...imageResults].sort((a, b) => a.topic.localeCompare(b.topic));
    
    for (const imageResult of sortedImageResults) {
      if (!imageResult.success || !imageResult.localPath) {
        continue;
      }
      
      // Create markdown image tag
      const relativePath = imageResult.localPath.replace(/^.*[\\\/]temp[\\\/]/, './temp/');
      const imageTag = `\n\n![${imageResult.description}](${relativePath})\n*Figure: ${imageResult.description}*\n\n`;
      
      // Find appropriate insertion point based on topic and placement
      // First try to find exact topic heading
      const topicRegex = new RegExp(`## ${imageResult.topic}|### ${imageResult.topic}`, 'i');
      const topicMatch = enhancedMarkdown.match(topicRegex);
      
      if (topicMatch) {
        // Insert after the heading and first paragraph
        const insertionPoint = this.findInsertionPoint(enhancedMarkdown, topicMatch.index);
        enhancedMarkdown = enhancedMarkdown.substring(0, insertionPoint) + 
                            imageTag + 
                            enhancedMarkdown.substring(insertionPoint);
      } else {
        // If exact topic not found, look for a section containing the topic keywords
        const words = imageResult.topic.split(/\s+/).filter(word => word.length > 3);
        for (const word of words) {
          if (word.length <= 3) continue; // Skip short words
          
          const keywordRegex = new RegExp(`## .*${word}.*|### .*${word}.*`, 'i');
          const keywordMatch = enhancedMarkdown.match(keywordRegex);
          
          if (keywordMatch) {
            const insertionPoint = this.findInsertionPoint(enhancedMarkdown, keywordMatch.index);
            enhancedMarkdown = enhancedMarkdown.substring(0, insertionPoint) + 
                               imageTag + 
                               enhancedMarkdown.substring(insertionPoint);
            break;
          }
        }
      }
    }
    
    return enhancedMarkdown;
  }

  static findInsertionPoint(text, startIndex) {
    // Find the end of the first paragraph after the heading
    const textAfterHeading = text.substring(startIndex);
    
    // Look for the next empty line which typically marks paragraph end
    const paragraphEndMatch = textAfterHeading.match(/\n\s*\n/);
    if (paragraphEndMatch) {
      return startIndex + paragraphEndMatch.index + paragraphEndMatch[0].length;
    }
    
    // If no paragraph end found, look for the next heading
    const nextHeadingMatch = textAfterHeading.match(/\n##/);
    if (nextHeadingMatch) {
      return startIndex + nextHeadingMatch.index;
    }
    
    // If neither found, just insert at the end of the heading line
    const lineEndMatch = textAfterHeading.match(/\n/);
    if (lineEndMatch) {
      return startIndex + lineEndMatch.index + 1;
    }
    
    // Fallback to original position
    return startIndex;
  }
}

export default ImageSuggestionAgent;