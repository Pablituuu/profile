import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const voiceId = searchParams.get('voiceId');
    const lang = searchParams.get('lang') || 'en';

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

    const NATIVE_LANGS: Record<string, string> = {
      '21m00Tcm4TlvDq8ikWAM': 'en', // Rachel
      EXAVITQu4vr4xnSDxMaL: 'en', // Sarah
      IKne3meq5aSn9XLyUdCD: 'en', // Charlie
      JBFqnCBsd6RMkjVDRZzb: 'en', // George
      Xb7hH8MSUJpSbSDYk0k2: 'en', // Alice
      XrExE9yKIg1WjnnlVkGX: 'en', // Matilda
      bIHbv24MWmeRgasZH58o: 'en', // Will
      cjVigY5qzO86Huf0OWal: 'en', // Eric
      nPczCjzI2devNBz1zQrb: 'en', // Brian
      pqHfZKP75CvOlQylNhV4: 'en', // Bill
      CwhRBWXzGAHq8TQ4Fs17: 'en', // Roger
      FGY2WhTYpPnrIDTdsKH5: 'en', // Laura
      N2lVS1w4EtoT3dr4eOWO: 'en', // Callum
      SAz9YHcvj6GT2YYXdXww: 'en', // River
      SOYHLrjzK2X1ezoPC6cr: 'en', // Harry
      TX3LPaxmHKxFdv7VOQHJ: 'en', // Liam
      cgSgspJ2msm6clMCkdW9: 'en', // Jessica
      hpp4J3VqNfWAUOO0d1Us: 'en', // Bella
      iP95p4xoKVk53GoZ742B: 'en', // Chris
      onwK4e9ZLuTAKqWW03F9: 'en', // Daniel
      pFZP5JQG7iQjIQuC4Bku: 'en', // Lily
      pNInz6obpgDQGcFmaJgB: 'en', // Adam
    };

    // 1. If requested language matches voice native language, use FREE preview
    if (NATIVE_LANGS[voiceId] === lang) {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/voices/${voiceId}`,
        {
          method: 'GET',
          headers: { 'xi-api-key': ELEVENLABS_API_KEY },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.preview_url) {
          return NextResponse.json({
            preview_url: data.preview_url,
            success: true,
          });
        }
      }
    }

    // 2. Otherwise, generate a short localized sample (Consumes characters)
    const texts: Record<string, string> = {
      en: 'Hi! This is my voice.',
      es: '¡Hola! Esta es mi voz.',
    };

    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: texts[lang] || texts.en,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json();
      const detail = errorData.detail?.message || JSON.stringify(errorData);
      throw new Error(`ElevenLabs: ${detail}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const dataUrl = `data:audio/mpeg;base64,${Buffer.from(audioBuffer).toString('base64')}`;

    return NextResponse.json({
      preview_url: dataUrl,
      success: true,
    });
  } catch (error: any) {
    console.error('[ElevenLabs Preview Error]:', error);
    return NextResponse.json(
      {
        error: 'Failed to get preview URL',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
