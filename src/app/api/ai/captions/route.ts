import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, readFileSync } from 'fs';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';

const execPromise = promisify(exec);
const writeFileAsync = promisify(writeFile);
const unlinkAsync = promisify(unlink);

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';

export async function POST(req: NextRequest) {
  console.log('--- API /api/ai/captions HIT ---');
  let tempVideoPath = '';
  let tempAudioPath = '';

  try {
    const { checkAiAccess } = await import('@/app/actions/check-api-key');
    const hasAccess = await checkAiAccess();

    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            'NO_ACCESS: No tienes permisos para usar funciones de IA o tu sesión ha expirado.',
        },
        { status: 403 }
      );
    }

    const apiKey = process.env.DEEPGRAM_API_KEY;

    const formData = await req.formData();
    const file = formData.get('video') as File;

    // We'll use detect_language=true to be safe for any video
    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    tempVideoPath = path.join(os.tmpdir(), `vid_${timestamp}.mp4`);
    tempAudioPath = path.join(os.tmpdir(), `aud_${timestamp}.mp3`);

    await writeFileAsync(tempVideoPath, buffer);

    console.log(`Extracting audio for Deepgram: ${tempAudioPath}`);
    // Extract audio using FFmpeg - increased quality and forced mono for better transcription
    try {
      await execPromise(
        `ffmpeg -i "${tempVideoPath}" -ar 16000 -ac 1 -c:a libmp3lame -q:a 2 -vn "${tempAudioPath}"`
      );
    } catch (ffmpegErr: any) {
      if (
        ffmpegErr.message.includes('Output file #0 does not contain any stream')
      ) {
        return NextResponse.json(
          {
            error:
              'The selected video does not have an audio track. Captions cannot be generated.',
          },
          { status: 400 }
        );
      }
      throw ffmpegErr;
    }

    const audioBuffer = readFileSync(tempAudioPath);
    console.log(`Audio size: ${audioBuffer.length} bytes`);

    console.log('Sending to Deepgram with detect_language=true...');
    // Using detect_language and nova-2
    const queryParams = new URLSearchParams({
      model: 'nova-2',
      smart_format: 'true',
      detect_language: 'true',
      punctuate: 'true',
      utterances: 'true',
    });

    const response = await fetch(
      `${DEEPGRAM_API_URL}?${queryParams.toString()}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'audio/mpeg',
        },
        body: audioBuffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram API error response:', errorText);
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    const result = await response.json();

    // Log a snippet of the transcript to verification in server logs
    const transcriptSnippet =
      result.results?.channels[0]?.alternatives[0]?.transcript || 'EMPTY';
    console.log(
      `Deepgram result transcript preview: "${transcriptSnippet.substring(0, 100)}..."`
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Captions API internal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    // Cleanup files
    if (tempVideoPath) await unlinkAsync(tempVideoPath).catch(() => {});
    if (tempAudioPath) await unlinkAsync(tempAudioPath).catch(() => {});
  }
}
