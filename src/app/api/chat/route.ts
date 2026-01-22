import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-robotics-er-1.5-preview'),
    messages: await convertToModelMessages(messages),
    system: `You are a friendly, professional, and proactive Video Editor AI Assistant. Your goal is to help users edit their videos with ease and precision using the DesignCombo editor.

    **CORE RESPONSIBILITIES:**
    1. **Execute Actions:** Use the available tools to perform actions like adding text, generating media, or updating styles.
    2. **Language Consistency:** ALWAYS respond in the SAME LANGUAGE as the user (Spanish or English).
    3. **Scope Enforcement:** ONLY answer questions related to video editing or the editor itself. Kindly refuse off-topic questions (news, weather, etc.).

    **TOOL USAGE RULES:**
    - **addText:** Use when the user wants to add NEW text to the timeline.
    - **updateSelectedTextStyle:** Use when the user wants to modify EXISTING selected text (color, size, content, etc.).
    - **generateImage:** Use when the user wants to create an AI image from a description.
    - **generateVideo:** Use when the user wants to create an AI video clip from a description.
    
    **CRITICAL RULES:**
    1. **NO IDs:** Do not ask for or invent internal IDs. The system handles "selected" assets automatically.
    2. **PROMPT TRANSLATION:** When using 'generateImage' or 'generateVideo', ALWAYS translate the 'prompt' to ENGLISH, even if the user speaks Spanish. This ensures better generation quality.
    3. **Brief Explanations:** Briefly explain what you are doing before calling a tool.
    4. **Impossible Requests:** If a request cannot be fulfilled by a tool, explain why politely.`,
    tools: {
      addText: tool({
        description: 'Add a text element to the video timeline',
        inputSchema: z.object({
          text: z.string().describe('The content of the text to add'),
          fontSize: z
            .number()
            .optional()
            .default(124)
            .describe('Font size in pixels'),
          color: z
            .string()
            .optional()
            .default('#ffffff')
            .describe('Hex color code for the text'),
          fontWeight: z
            .string()
            .optional()
            .default('bold')
            .describe('CSS font weight'),
        }),
      }),
      generateImage: tool({
        description: 'Generate an image based on a text prompt',
        inputSchema: z.object({
          prompt: z
            .string()
            .describe('The description of the image to generate'),
        }),
      }),
      updateSelectedTextStyle: tool({
        description:
          'Update the style or content of the currently selected text clip(s)',
        inputSchema: z.object({
          text: z.string().optional().describe('New content for the text'),
          fontSize: z.number().optional().describe('New font size in pixels'),
          color: z.string().optional().describe('New hex color code'),
          fontWeight: z.string().optional().describe('New CSS font weight'),
          textAlign: z
            .enum(['left', 'center', 'right'])
            .optional()
            .describe('Text alignment'),
          opacity: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .describe('Opacity (0 to 1)'),
        }),
      }),
      generateVideo: tool({
        description: 'Generate a video based on a text prompt',
        inputSchema: z.object({
          prompt: z
            .string()
            .describe('The description of the video to generate'),
        }),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
