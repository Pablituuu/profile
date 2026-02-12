import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { Storage } from '@google-cloud/storage';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Inicializar cliente de GCS
function getStorageClient() {
  const privateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (
    !privateKey ||
    !process.env.GCS_CLIENT_EMAIL ||
    !process.env.GCS_PROJECT_ID
  ) {
    throw new Error('Missing GCS credentials');
  }
  return new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
      client_email: process.env.GCS_CLIENT_EMAIL,
      private_key: privateKey,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const type = formData.get('type') as 'text' | 'audio';
    const voiceId = formData.get('voiceId') as string;
    const text = formData.get('text') as string;
    const audioFile = formData.get('audio') as File | null;

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: 'ElevenLabs API Key is missing' },
        { status: 500 }
      );
    }

    if (!voiceId) {
      return NextResponse.json(
        { error: 'voiceId is required' },
        { status: 400 }
      );
    }

    let audioBuffer: Buffer;

    if (type === 'text') {
      if (!text)
        return NextResponse.json(
          { error: 'Text is required' },
          { status: 400 }
        );

      console.log(`[ElevenLabs] Generating TTS for voice ${voiceId}`);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'ElevenLabs TTS failed');
      }

      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
    } else {
      if (!audioFile)
        return NextResponse.json(
          { error: 'Audio file is required' },
          { status: 400 }
        );

      console.log(`[ElevenLabs] Generating STS for voice ${voiceId}`);

      const stsFormData = new FormData();
      stsFormData.append('audio', audioFile);
      stsFormData.append('model_id', 'eleven_english_sts_v2');

      const response = await fetch(
        `https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: stsFormData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'ElevenLabs STS failed');
      }

      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
    }

    // Subir a GCS
    const storage = getStorageClient();
    const bucketName = process.env.GCS_BUCKET_NAME!;
    const bucket = storage.bucket(bucketName);
    const fileName = `voice-ai/${Date.now()}_generated.mp3`;
    const file = bucket.file(fileName);

    await file.save(audioBuffer, {
      contentType: 'audio/mpeg',
    });

    // Emplear una URL firmada de larga duración (o pública si prefieres)
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    return NextResponse.json({
      url,
      fileName,
      success: true,
    });
  } catch (error: any) {
    console.error('[ElevenLabs API Error]:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate voice',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
