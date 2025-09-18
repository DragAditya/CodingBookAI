import { GoogleGenerativeAI } from '@google/generative-ai';
import { Question, ChatMessage, GeminiError } from './types';
import { retry, getErrorMessage } from './utils';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-pro',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ],
});

export async function generateQuestionMetadata(title: string): Promise<Omit<Question, 'id' | 'created_at' | 'updated_at'>> {
  if (!title || title.trim().length === 0) {
    throw new GeminiError('Title cannot be empty');
  }

  const prompt = `
Generate comprehensive metadata for a coding problem with the title: "${title.trim()}"

Please provide a JSON response with the following structure:
{
  "title": "${title.trim()}",
  "difficulty": "Easy|Medium|Hard",
  "topics": ["topic1", "topic2", ...],
  "description": "Clear, beginner-friendly problem description (100-500 words)",
  "example": {
    "input": "sample input with proper formatting",
    "output": "expected output with proper formatting", 
    "explanation": "detailed explanation of why this output is correct"
  },
  "solution_python": "complete, executable Python solution with proper formatting and comments",
  "step_by_step_explanation": ["step 1 explanation", "step 2 explanation", ...],
  "pseudocode": ["pseudocode line 1", "pseudocode line 2", ...]
}

Requirements:
- Description must be clear, educational, and beginner-friendly
- Code must be properly formatted, executable, and well-commented
- Include proper error handling in the solution
- Explanations should be detailed and educational
- Topics should be relevant programming concepts
- Difficulty should match the complexity of the problem
- Provide at least 3-5 step-by-step explanations
- Include time and space complexity analysis in explanations
- Ensure the solution handles edge cases

Return ONLY the JSON object, no additional text.
  `;

  try {
    const result = await retry(async () => {
      const response = await model.generateContent(prompt);
      const text = response.response.text();
      
      if (!text) {
        throw new GeminiError('Empty response from Gemini API');
      }
      
      return text;
    }, 3, 1000);
    
    // Clean up the response to extract JSON
    const cleanedText = result.trim();
    let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      // Try to find JSON between code blocks
      const codeBlockMatch = cleanedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (codeBlockMatch) {
        jsonMatch = [codeBlockMatch[1]];
      }
    }
    
    if (!jsonMatch) {
      console.error('Invalid response format:', cleanedText);
      throw new GeminiError('Invalid response format from Gemini API');
    }
    
    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!parsedResponse.title || !parsedResponse.difficulty || !parsedResponse.description) {
      throw new GeminiError('Incomplete response from Gemini API');
    }
    
    // Ensure arrays are properly formatted
    parsedResponse.topics = Array.isArray(parsedResponse.topics) ? parsedResponse.topics : [];
    parsedResponse.step_by_step_explanation = Array.isArray(parsedResponse.step_by_step_explanation) 
      ? parsedResponse.step_by_step_explanation 
      : [];
    parsedResponse.pseudocode = Array.isArray(parsedResponse.pseudocode) 
      ? parsedResponse.pseudocode 
      : undefined;
    
    return parsedResponse;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('Error generating question metadata:', errorMessage);
    
    if (error instanceof GeminiError) {
      throw error;
    }
    
    throw new GeminiError(`Failed to generate question metadata: ${errorMessage}`);
  }
}

export async function generateChatResponse(
  question: Question, 
  userMessage: string, 
  chatHistory: ChatMessage[]
): Promise<string> {
  if (!userMessage || userMessage.trim().length === 0) {
    throw new GeminiError('Message cannot be empty');
  }

  if (!question) {
    throw new GeminiError('Question context is required');
  }

  const historyContext = chatHistory
    .slice(-10) // Limit to last 10 messages for context
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const prompt = `
You are an AI coding tutor helping students understand programming problems. 

Question Context:
- Title: ${question.title}
- Difficulty: ${question.difficulty}
- Topics: ${question.topics.join(', ')}
- Description: ${question.description}
- Solution: ${question.solution_python}

Previous conversation:
${historyContext}

Current user question: ${userMessage.trim()}

Please provide a helpful, educational response. You can:
- Explain the solution in different ways
- Provide alternative approaches or optimizations
- Clarify programming concepts
- Help debug code issues
- Suggest improvements
- Explain time/space complexity
- Provide hints without giving away the complete solution

Guidelines:
- Keep responses concise but informative (max 300 words)
- Use clear, beginner-friendly language
- Include code examples when helpful
- Be encouraging and supportive
- Focus on learning and understanding

Response:
  `;

  try {
    const result = await retry(async () => {
      const response = await model.generateContent(prompt);
      const text = response.response.text();
      
      if (!text) {
        throw new GeminiError('Empty response from Gemini API');
      }
      
      return text.trim();
    }, 3, 1000);
    
    return result;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('Error generating chat response:', errorMessage);
    
    if (error instanceof GeminiError) {
      throw error;
    }
    
    throw new GeminiError(`Failed to generate chat response: ${errorMessage}`);
  }
}

export async function validateGeminiApiKey(): Promise<boolean> {
  try {
    const testPrompt = 'Respond with "API key is valid" if you can read this message.';
    const result = await model.generateContent(testPrompt);
    const response = result.response.text();
    return response.toLowerCase().includes('api key is valid');
  } catch {
    return false;
  }
}