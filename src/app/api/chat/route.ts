import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-2.0-flash'),
    messages: await convertToModelMessages(messages),
    system: `You are a professional Video Editor AI Assistant for the DesignCombo editor.
    
    **CRITICAL STABILITY RULES:**
    1. **Tool Calls:** When calling a tool, do NOT explain what you are doing. JUST call the tool.
    2. **JSON Stringified Input:** For tools like 'addText' or 'update' styles, you MUST send a SINGLE string field named 'json' containing the actual parameters as a JSON object.
    3. **No Incremental Objects:** Do NOT send nested objects directly. Stringify them into the 'json' field to ensure streaming stability.
    4. **Consistency:** Decide all property values BEFORE starting the tool call block.`,
    tools: {
      addText: tool({
        description:
          'Add a text element to the video timeline. Input must be a JSON string containing text, color, fontSize, and fontWeight.',
        inputSchema: z.object({
          json: z
            .string()
            .describe('JSON string: {text, color, fontSize, fontWeight}'),
        }),
      }),
      generateImage: tool({
        description: 'Generate an image based on a text prompt',
        inputSchema: z.object({
          prompt: z
            .string()
            .describe('The description of the image in English'),
        }),
      }),
      generateVideo: tool({
        description: 'Generate a video based on a text prompt',
        inputSchema: z.object({
          prompt: z
            .string()
            .describe('The description of the video in English'),
        }),
      }),
      updateSelectedMediaStyle: tool({
        description:
          'Update properties of selected media. Input must be a JSON string of properties to update.',
        inputSchema: z.object({
          json: z.string().describe('JSON string of style properties'),
        }),
      }),
      updateSelectedTextStyle: tool({
        description:
          'Update properties of selected text. Input must be a JSON string of properties to update.',
        inputSchema: z.object({
          json: z.string().describe('JSON string of text properties'),
        }),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
