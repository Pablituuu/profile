// Ubicación: src/app/api/ai/highlights/route.ts
import { NextRequest } from 'next/server';
import { VertexAI, SchemaType } from '@google-cloud/vertexai';

export const maxDuration = 300;

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  const projectId = process.env.GCS_PROJECT_ID || 'pablituuu-personal';
  const location = 'us-east4';
  const privateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');

  const vertex = new VertexAI({
    project: projectId,
    location: location,
    googleAuthOptions: {
      credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: privateKey,
      },
    },
  });

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

        console.log(`[API] Analizando Fragmento: ${gcsUri}`);

        const model = vertex.getGenerativeModel({
          model: 'gemini-2.0-flash-001',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  start: { type: SchemaType.NUMBER },
                  end: { type: SchemaType.NUMBER },
                  description: { type: SchemaType.STRING },
                  viralScore: { type: SchemaType.NUMBER },
                },
                required: ['title', 'start', 'end', 'description'],
              },
            },
          },
        });

        const prompt = `Act as a world-class viral video editor. 
Analyze THIS video segment.
TASK: Identify high-engagement moments between ${minT}s and ${maxT}s.
IMPORTANT: Return absolute seconds (0s is the start of THIS file).
Return a valid JSON array.`;

        let result;
        let retries = 3;
        let waitTime = 10000;

        while (retries > 0) {
          try {
            result = await model.generateContent({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { fileData: { mimeType: 'video/mp4', fileUri: gcsUri } },
                    { text: prompt },
                  ],
                },
              ],
            });
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

        if (!result) throw new Error('No response from Vertex.');

        const response = await result.response;
        const rawText =
          response.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        const cleanJson = rawText
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        const clips = JSON.parse(cleanJson);

        sendUpdate({
          status: 'chunk_done',
          clips: clips,
        });
      } catch (error: any) {
        console.error('ERROR API:', error.message);
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
