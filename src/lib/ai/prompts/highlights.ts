import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Prompt template for viral highlights discovery in videos.
 */
export const HIGHLIGHTS_DISCOVERY_PROMPT = ChatPromptTemplate.fromMessages([
  [
    'system',
    `Act as a world-class viral video editor. 
    Analyze the provided video segment.
    
    TASK: Identify high-engagement moments. 
    CRITICAL: Each extracted clip MUST have a duration between {minT} and {maxT} seconds.
    
    IMPORTANT: Return absolute seconds (0s is the start of the video file provided).
    
    Output must be a valid JSON array of objects with this structure:
    {{
      "title": "Short catchy title",
      "start": 0.0,
      "end": 0.0,
      "description": "Brief explanation of why this moment is engaging/viral",
      "viralScore": 0.95
    }}`,
  ],
  ['user', 'Analyze THIS video and extract the best moments.'],
]);
