// Ubicación: src/app/api/ai/highlights/route.ts
import { NextRequest } from 'next/server';
import { vertexFlash } from '@/lib/ai/clients';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { HumanMessage } from '@langchain/core/messages';
import { HIGHLIGHTS_DISCOVERY_PROMPT } from '@/lib/ai/prompts/highlights';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (data: any) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch (e) {}
      };

      try {
        const body = await req.json();
        const { fileName, targetDuration } = body;
        const bucketName = process.env.GCS_BUCKET_NAME;
        const gcsUri = `gs://${bucketName}/${fileName}`;
        const [minT, maxT] = (targetDuration || '30-60').split('-').map(Number);

        console.log(
          `[API] Analizando Fragmento con LangChain Chain: ${gcsUri}`
        );

        // Use the centralized prompt template for precise duration control
        const formattedPrompt = await HIGHLIGHTS_DISCOVERY_PROMPT.format({
          minT,
          maxT,
        });

        let result;
        let retries = 3;
        let waitTime = 10000;

        const parser = new JsonOutputParser();

        while (retries > 0) {
          try {
            // LangChain human message with multi-modal parts (Vertex AI format)
            const message = new HumanMessage({
              content: [
                {
                  type: 'media',
                  mimeType: 'video/mp4',
                  fileUri: gcsUri,
                } as any, // Cast because Vertex types might be strict
                { type: 'text', text: formattedPrompt },
              ],
            });

            const response = await vertexFlash.invoke([message]);
            result = await parser.parse(response.content as string);
            break;
          } catch (err: any) {
            const isQuota = err.message?.includes('429') || err.code === 429;
            if (isQuota && retries > 1) {
              sendUpdate({
                status: 'processing',
                message: `Cuota regional llena. Reintentando en ${waitTime / 1000}s...`,
              });
              await delay(waitTime);
              retries--;
              waitTime *= 2;
            } else {
              throw err;
            }
          }
        }

        if (!result) throw new Error('No response from Gemini.');

        sendUpdate({
          status: 'chunk_done',
          clips: result,
        });
      } catch (error: any) {
        console.error('ERROR API HIGHLIGHTS (LangChain):', error.message);
        sendUpdate({ status: 'error', message: error.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
