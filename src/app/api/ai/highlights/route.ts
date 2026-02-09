import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Para Next.js App Router
export const maxDuration = 300; // 5 minutos máximo

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

export async function POST(req: NextRequest) {
  console.log('--- API /api/ai/highlights [VIDEO URL MODE] ---');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const apiKey = getEnvVar('GOOGLE_GENERATIVE_AI_API_KEY');
        const genAI = new GoogleGenerativeAI(apiKey);

        // Recibir videoUrl extraído y subido por el cliente
        const body = await req.json();
        const { videoUrl, duration, targetDuration } = body;
        console.log('[API] Body recibido:', {
          duration,
          targetDuration,
          hasUrl: !!videoUrl,
        });

        if (!videoUrl) {
          throw new Error(
            'No videoUrl provided. Upload the video to storage first.'
          );
        }

        console.log(
          `[API] Analizando video desde: ${videoUrl.substring(0, 80)}...`
        );

        sendUpdate({
          status: 'status_init',
          message: `Iniciando análisis del video...`,
        });

        const [minTarget, maxTarget] = (targetDuration || '30-60')
          .split('-')
          .map(Number);

        console.log(`[API] Targets: min=${minTarget}, max=${maxTarget}`);

        const PADDING = 2; // Menos padding ahora que analizamos el video completo
        const minAI = Math.max(5, minTarget - PADDING * 2);
        const maxAI = maxTarget - PADDING * 2;

        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.STRING },
                  title: { type: SchemaType.STRING },
                  start: {
                    type: SchemaType.NUMBER,
                    description: 'Relative start time (seconds)',
                  },
                  end: {
                    type: SchemaType.NUMBER,
                    description: 'Relative end time (seconds)',
                  },
                  description: { type: SchemaType.STRING },
                },
                required: ['id', 'title', 'start', 'end', 'description'],
              },
            },
          },
        });

        // 1. Descargar el video desde la Signed URL para enviarlo a Gemini
        sendUpdate({
          status: 'processing',
          message: 'Preparando video para Gemini...',
        });

        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok)
          throw new Error(
            `Failed to fetch video from storage. Status: ${videoResponse.status}`
          );

        const videoBuffer = await videoResponse.arrayBuffer();
        console.log(
          `[API] Video descargado para Gemini: ${(videoBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`
        );

        const videoBase64 = Buffer.from(videoBuffer).toString('base64');

        const videoPart = {
          inlineData: {
            data: videoBase64,
            mimeType: 'video/mp4',
          },
        };

        const prompt = `You are a World-Class Viral Content Strategist and Video Editor. 
The provided video is EXACTLY ${duration} seconds long.
Analyze it to identify the best 10-15 most engaging moments.

STRICT REQUIREMENTS:
- Provide at least 5-10 distinct clips.
- Each highlight MUST be exactly between ${minTarget} and ${maxTarget} seconds long to follow the user preference.
- Use human-readable SECONDS for 'start' and 'end' (e.g., 45.2). 
- All timestamps MUST be between 0 and ${duration}.
- Ensure clips are unique and represent different high-engagement moments in the video.

Return ONLY valid JSON array of objects:
[{ "id": "unique_string", "title": "Viral Clickbait Title", "description": "Why this specific moment is gold", "start": seconds, "end": seconds }]`;

        sendUpdate({
          status: 'chunk_analyzing',
          chunkIndex: 0,
          totalChunks: 1,
          message: `La IA está analizando el video completo (${duration}s)...`,
        });

        console.log('[API] Enviando petición a Gemini...');
        const result = await model.generateContent([
          videoPart,
          { text: prompt },
        ]);

        const rawText = result.response.text();
        console.log('[API] Respuesta raw de Gemini:', rawText);

        const clips = JSON.parse(rawText);
        console.log(`[API] Gemini encontró ${clips.length} clips potenciales.`);

        // Aplicar padding y validar clips (quitamos el filtro restrictivo de duración)
        const finalClips = clips
          .filter((c: any) => c.start !== undefined && c.end !== undefined)
          .map((c: any) => {
            let s = Number(c.start);
            let e = Number(c.end);
            if (s > e) [s, e] = [e, s];

            // Aplicar padding
            const paddedStart = Math.max(0, s - PADDING);
            const paddedEnd = Math.min(duration || e + PADDING, e + PADDING);

            return {
              ...c,
              start: Math.round(paddedStart * 10) / 10,
              end: Math.round(paddedEnd * 10) / 10,
            };
          });

        console.log(
          `[API] Enviando ${finalClips.length} clips finales al cliente.`
        );

        sendUpdate({
          status: 'chunk_done',
          clips: finalClips,
          chunkIndex: 0,
          totalChunks: 1,
        });

        sendUpdate({ status: 'all_done' });
      } catch (error: any) {
        console.error('Critical Stream Error:', error);
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
