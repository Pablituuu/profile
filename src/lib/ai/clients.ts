import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatVertexAI } from '@langchain/google-vertexai';

/**
 * Shared AI models instance using LangChain
 */

const privateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Initialize Gemini 2.0 Flash (Optimized for speed/cost)
export const geminiFlash = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash',
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'MISSING_API_KEY',
});

// Initialize Gemini 2.0 Flash Thinking (Optimized for complex reasoning)
export const geminiThinking = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash-thinking-exp-01-21',
  maxOutputTokens: 4096,
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'MISSING_API_KEY',
});

// Vertex AI instance (Required for Features that need fileUri/GCS support like Highlights)
export const vertexFlash = new ChatVertexAI({
  model: 'gemini-2.0-flash-001',
  temperature: 0,
  maxOutputTokens: 2048,
  authOptions: {
    credentials: {
      client_email: process.env.GCS_CLIENT_EMAIL || 'missing@email.com',
      private_key: privateKey || 'missing-private-key',
    },
    projectId: process.env.GCS_PROJECT_ID || 'missing-project-id',
  },
});
