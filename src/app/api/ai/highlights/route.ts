import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import { writeFile, unlink, createWriteStream } from 'fs';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import ytdl from '@distube/ytdl-core';

const execPromise = promisify(exec);
const writeFileAsync = promisify(writeFile);
const unlinkAsync = promisify(unlink);

// Standard chunk size: 10 minutes for massive context (helps detect long conversations/moments)
const CHUNK_DURATION_SECONDS = 10 * 60;
const FPS_FOR_ANALYSIS = 4; // 4fps is the sweet spot for 10-minute chunks (stays under 1M tokens)

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

async function getVideoDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execPromise(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error('Failed to get video duration:', error);
    return 0;
  }
}

async function extractAndOptimizeChunk(
  inputPath: string,
  outputPath: string,
  startTime: number,
  duration: number
) {
  try {
    console.log(`Extracting chunk from ${startTime}s for ${duration}s...`);
    // Extract chunk and scale/fps in one go for efficiency
    // -ss is very fast when placed before -i
    const command = `ffmpeg -y -ss ${startTime} -t ${duration} -i "${inputPath}" -vf "scale='min(1280,iw)':-2:force_original_aspect_ratio=decrease,scale=-2:360,fps=${FPS_FOR_ANALYSIS}" -c:v libx264 -preset ultrafast -crf 32 -c:a aac -b:a 32k -ac 1 "${outputPath}"`;

    await execPromise(command, {
      maxBuffer: 1024 * 1024 * 10,
      env: { ...process.env, PATH: `${process.env.PATH}:/usr/bin` },
    });
    return true;
  } catch (error) {
    console.error('FFmpeg chunk extraction failed:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  console.log('--- API /api/ai/highlights [STREAMING] HIT ---');
  let tempOriginalPath = '';
  let chunkFiles: string[] = [];

  const encoder = new TextEncoder();

  // Create a TransformStream for SSE-like response
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const apiKey = getEnvVar('GOOGLE_GENERATIVE_AI_API_KEY');
        const genAI = new GoogleGenerativeAI(apiKey);
        const fileManager = new GoogleAIFileManager(apiKey);

        const formData = await req.formData();
        const file = formData.get('video') as File;
        const youtubeUrl = formData.get('youtubeUrl') as string;
        const targetDuration =
          (formData.get('targetDuration') as string) || '30-60';

        if (!file && !youtubeUrl)
          throw new Error('No video file or URL provided');

        // 1. Get the video (either upload or download)
        if (youtubeUrl) {
          sendUpdate({
            status: 'status_init',
            message: 'Auth: Initiating Deep Bypass for Data Centers...',
          });

          const cookieContent = process.env.YOUTUBE_COOKIES || '';
          tempOriginalPath = path.join(os.tmpdir(), `yt_${Date.now()}.mp4`);
          const cookiesFile = path.join(
            os.tmpdir(),
            `cookies_${Date.now()}.txt`
          );

          // Robust Cookie Handling:
          // If the string starts with #, it's already Netscape format.
          // Otherwise, we wrap it into a valid Netscape file for yt-dlp.
          let finalCookieContent = cookieContent;
          if (!cookieContent.trim().startsWith('#')) {
            const netscapeHeader = '# Netscape HTTP Cookie File\n';
            const netscapeCookies = cookieContent
              .split(';')
              .map((c) => {
                const [name, ...val] = c.trim().split('=');
                if (!name || !val.length) return '';
                return `.youtube.com\tTRUE\t/\tTRUE\t2147483647\t${name}\t${val.join('=')}`;
              })
              .filter(Boolean)
              .join('\n');
            finalCookieContent = netscapeHeader + netscapeCookies;
          }

          await writeFileAsync(cookiesFile, finalCookieContent);

          sendUpdate({
            status: 'status_init',
            message: 'yt-dlp: Bypassing via iOS Native Client...',
          });

          try {
            // Updated for early 2026:
            // 1. Used --cookies instead of --add-header (STRICTLY REQUIRED for flagged IPs)
            // 2. Changed client to ios (currently more stable on GCP)
            // 3. Kept Deno for decryption
            const ytDlpCmd = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" \
              --merge-output-format mp4 \
              --no-playlist \
              --cookies "${cookiesFile}" \
              --js-runtime deno \
              --extractor-args "youtube:player-client=ios,web" \
              -o "${tempOriginalPath}" \
              "${youtubeUrl}"`;

            console.log('[yt-dlp] Executing Deep Bypass...');
            await execPromise(ytDlpCmd, {
              env: { ...process.env, PATH: `${process.env.PATH}:/usr/bin` },
            });

            sendUpdate({
              status: 'upload_complete',
              message: 'Video downloaded (Deep Bypass)! Analyzing...',
              videoUrl: `/api/ai/video/serve?path=${encodeURIComponent(tempOriginalPath)}`,
            });
          } catch (dlError: any) {
            console.error('[yt-dlp Error]', dlError);
            throw new Error(
              `GCP Security Block: YouTube rejected the server IP. Please update YOUTUBE_COOKIES with a full cookies.txt file content.`
            );
          } finally {
            await unlinkAsync(cookiesFile).catch(() => {});
          }
        } else if (file) {
          sendUpdate({
            status: 'status_init',
            message: 'Uploading and saving...',
          });

          const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
          tempOriginalPath = path.join(
            os.tmpdir(),
            `orig_${Date.now()}_${safeName}`
          );

          // Stream the file to disk to save memory (Prevents 2x RAM usage)
          const writer = createWriteStream(tempOriginalPath);
          const reader = file.stream().getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            writer.write(Buffer.from(value));
          }
          writer.end();

          // Wait for the stream to fully finish writing
          await new Promise((resolve) =>
            writer.on('finish', () => resolve(undefined))
          );

          sendUpdate({
            status: 'upload_complete',
            message: 'Video ready. Calculating parts...',
          });
        }

        const [minTarget, maxTarget] = targetDuration.split('-').map(Number);
        const PADDING = 5;
        const dynamicOverlap = maxTarget + 30; // 30s buffer over the max clip duration

        // To get a final clip of [min, max], the AI should find a core moment of [min-10, max-10].
        const minAI = Math.max(5, minTarget - PADDING * 2);
        const maxAI = maxTarget - PADDING * 2;

        // 2. Get Duration and Calculate Chunks
        const duration = await getVideoDuration(tempOriginalPath);
        if (duration <= 0)
          throw new Error('Could not determine video duration');

        const numChunks = Math.ceil(
          duration / (CHUNK_DURATION_SECONDS - dynamicOverlap)
        );

        sendUpdate({ status: 'processing', totalChunks: numChunks, duration });

        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash', // Verified active model
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
                    description: 'Relative start time in chunk (s)',
                  },
                  end: {
                    type: SchemaType.NUMBER,
                    description: 'Relative end time in chunk (s)',
                  },
                  description: { type: SchemaType.STRING },
                },
                required: ['id', 'title', 'start', 'end', 'description'],
              },
            },
          },
        });

        // 3. Process each chunk
        for (let i = 0; i < numChunks; i++) {
          const chunkStartTime = i * (CHUNK_DURATION_SECONDS - dynamicOverlap);
          const chunkDuration = Math.min(
            CHUNK_DURATION_SECONDS,
            duration - chunkStartTime
          );

          if (chunkDuration < 5) continue; // Skip tiny final chunks

          const chunkPath = path.join(
            os.tmpdir(),
            `chunk_${i}_${Date.now()}.mp4`
          );
          chunkFiles.push(chunkPath);

          sendUpdate({
            status: 'chunk_optimizing',
            chunkIndex: i,
            totalChunks: numChunks,
          });

          const success = await extractAndOptimizeChunk(
            tempOriginalPath,
            chunkPath,
            chunkStartTime,
            chunkDuration
          );
          if (!success) continue;

          sendUpdate({ status: 'chunk_uploading', chunkIndex: i });

          // Upload and Wait for Gemini
          const uploadResult = await fileManager.uploadFile(chunkPath, {
            mimeType: 'video/mp4',
            displayName: `chunk_${i}.mp4`,
          });

          let fileState = await fileManager.getFile(uploadResult.file.name);
          while (fileState.state === FileState.PROCESSING) {
            await new Promise((r) => setTimeout(r, 2000));
            fileState = await fileManager.getFile(uploadResult.file.name);
          }

          if (fileState.state === FileState.FAILED) continue;

          sendUpdate({ status: 'chunk_analyzing', chunkIndex: i });

          const prompt = `You are a World-Class Viral Content Strategist. 
          Analyze this video segment (part ${i + 1} of ${numChunks}) to extract the "Retention Peaks" — identify NOT ONLY quick hooks but also LONG, continuous segments where the engagement remains high (e.g., 2-3 minute compelling stories or debates).
          
          Identify the top 10-15 most engaging moments.
          
          SPECIFIC SIGNALS:
          1. RETENTION PEAKS: Moments that people would replay or share, even if they are long.
          2. HOOKS & CLIMAX: Clear beginning and resolution of topics.
          3. EMOTIONAL HIGHS: Continuous laughter, tension, or debate.
          
          STRICT DURATIONAL LIMITS:
          - Each moment MUST be between ${minAI} and ${maxAI} seconds.
          - Timestamps MUST be relative to THIS segment (0s to ${chunkDuration}s).
          
          Respond ONLY with valid JSON.
          [{ "title": "...", "description": "...", "start": seconds, "end": seconds }]`;

          const result = await model.generateContent([
            {
              fileData: {
                mimeType: uploadResult.file.mimeType,
                fileUri: uploadResult.file.uri,
              },
            },
            { text: prompt },
          ]);

          const clips = JSON.parse(result.response.text());

          // Map timestamps + Add 10s context padding
          const globalClips = clips
            .filter((c: any) => c.start !== undefined && c.end !== undefined)
            .map((c: any) => {
              let s = Number(c.start);
              let e = Number(c.end);
              if (s > e) [s, e] = [e, s];

              const paddedStart = Math.max(
                0,
                Math.min(chunkDuration, s - PADDING)
              );
              const paddedEnd = Math.max(
                0,
                Math.min(chunkDuration, e + PADDING)
              );

              const finalDuration = paddedEnd - paddedStart;

              // REJECT if it doesn't meet the user's minimum preference
              if (finalDuration < minTarget - 2) return null; // 2s tolerance for edge cases

              return {
                ...c,
                id: `chunk_${i}_${c.id || Math.random().toString(36).substr(2, 9)}`,
                start: Math.round(paddedStart + chunkStartTime),
                end: Math.round(paddedEnd + chunkStartTime),
              };
            })
            .filter(Boolean);

          sendUpdate({
            status: 'chunk_done',
            clips: globalClips,
            chunkIndex: i,
            totalChunks: numChunks,
          });

          // Cleanup Gemini file
          await fileManager.deleteFile(uploadResult.file.name).catch(() => {});
        }

        sendUpdate({ status: 'all_done' });
      } catch (error: any) {
        console.error('Critical Stream Error:', error);
        sendUpdate({ status: 'error', message: error.message });
      } finally {
        // Cleanup local files
        try {
          if (tempOriginalPath)
            await unlinkAsync(tempOriginalPath).catch(() => {});
          for (const f of chunkFiles) await unlinkAsync(f).catch(() => {});
        } catch (e) {}
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
