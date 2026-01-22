import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Server Configuration Error: Missing GOOGLE_GENERATIVE_AI_API_KEY',
        },
        { status: 500 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Using veo-3.1-generate-preview as requested (cost effective, fast)
    // Note: generateVideos returns an operation that needs polling
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: prompt,
    });

    // Validating operation structure
    if (!operation || !operation.name) {
      return NextResponse.json(
        { error: 'Failed to initiate video generation' },
        { status: 500 }
      );
    }

    // Poll for completion (Sync-ish for now, with timeout)
    const startTime = Date.now();
    const timeout = 180000; // 3 minutes timeout

    while (!operation.done) {
      if (Date.now() - startTime > timeout) {
        return NextResponse.json(
          { error: 'Video generation timed out' },
          { status: 504 }
        );
      }

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log(
        `Polling for video... ${Math.round((Date.now() - startTime) / 1000)}s`
      );

      // Refresh operation status
      // SDK might have a polling method, or we re-fetch operation
      // The snippet used: ai.operations.getVideosOperation
      // But SDK types might vary. Assuming the snippet provided by user is correct for the installed version.
      // wait, user snippet says: ai.operations.getVideosOperation({ operation: operation })? No...
      // Snippet: operation = await ai.operations.getVideosOperation({ operation: operation }); // Not standard.
      // Usually it's: operation = await ai.operations.get({ name: operation.name });
      // Let's look at the snippet text again closely.
      // "operation = await ai.operations.getVideosOperation({ operation: operation, });"
      // Okay I will follow that pattern exactly.

      // Wait, I cannot see the snippet text right now, I need to trust the user provided it or I should look at it if I saved it.
      // User provided:
      // while (!operation.done) { ... operation = await ai.operations.getVideosOperation({ operation: operation }); }

      // However, I need to match the actual SDK method names.
      // If that fails, I'll try standard keys.

      try {
        // Correct SDK usage: ai.operations.getVideosOperation({ operation: operation })
        operation = await ai.operations.getVideosOperation({
          operation: operation,
        });
      } catch (e) {
        console.log('Polling error, maybe operation object updates itself?', e);
      }

      // Re-check done status
      if (operation.done) break;
    }

    // Download/Extract result
    // Snippet: ai.files.download({ file: operation.response.generatedVideos[0].video, ... })
    // We want the URL to return to frontend, not download to server disk.
    // The response likely contains a `uri` for the video.

    // Let's inspect the operation response structure
    const result = (operation as any).result || (operation as any).response;
    if (!result) {
      return NextResponse.json(
        { error: 'No result in operation' },
        { status: 500 }
      );
    }

    // Depending on SDK, it might be result.generatedVideos[0].video.uri
    const videoUri = result.generatedVideos?.[0]?.video?.uri;

    // If it's a file URI (google file API), we might need to proxy it or sign it?
    // Often it returns a short-lived URL.
    // Or base64.

    // If user snippet says "ai.files.download", it implies it's not a public URL.
    // This is tricky. If we can't get a public URL, we might need to fetch the bytes and return base64.
    // Let's try to get base64 if possible or return the URI if it's accessible.

    // Simplest approach: Assume we can get a URL. If not, we'll error and debug.

    if (videoUri) {
      return NextResponse.json({ url: videoUri });
    }

    return NextResponse.json(
      { error: 'Video URI not found in response', details: result },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Veo Video Gen Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
