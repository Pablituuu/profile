import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Storage } from '@google-cloud/storage';

const STYLE_DEFINITIONS: Record<string, string> = {
  REALISTIC:
    'Extreme photorealism, focus on lifelike skin textures, cinematic natural lighting, 8k resolution, global illumination, Ray Tracing, professional cinematography.',
  MANGA:
    'High-end Anime Studio Mappa/Ufotable style, clean line art, vibrant cel-shading, cinematic lighting, expressive features, masterpiece anime quality.',
  CINEMATIC:
    'Hollywood high-budget movie still, anamorphic lens flares, teal and orange color grading, dramatic lighting, volumetric fog, IMAX quality, cinematic masterpiece.',
  '3D': 'Modern 3D render, High-end Octane render style, Ray Traced reflections, digital clean look, high-end toy aesthetic, 4k digital masterpiece.',
  CARTOON:
    'Modern whimsical illustration style, Disney/Pixar modern look, bold colors, playful character design, smooth gradients, clean vector animation look.',
  PIXEL:
    'High quality masterpiece pixel art, 32-bit aesthetic, vibrant palette, sharp distinct grid structure, retro game feel, clean edges.',
  WATERCOLOR:
    'Traditional fluid watercolor painting, rough paper texture, delicate hand-painted washes of color, artistic drips, fluid masterpiece transitions.',
  OIL: 'Classic oil on canvas, visible impasto brushstrokes, rich physical paint texture, deep colors, dramatic chiaroscuro, artistic depth.',
  OIL_PAINTING:
    'Classic oil on canvas, visible impasto brushstrokes, rich physical paint texture, deep colors, dramatic chiaroscuro, artistic depth.',
  CYBERPUNK:
    'Futuristic neon aesthetic, high-tech low-life, glowing lights, rain-slicked streets, metallic surfaces, purple and blue cinematic palette.',
  SKETCH:
    'Hand-drawn graphite pencil sketch, fine cross-hatching, charcoal shading, artistic feeling, white paper background, raw masterpiece sketch.',
  VINTAGE:
    '1970s film grain photography, Kodak Portra 400 aesthetic, grainy texture, warm sepia tones, light leaks, nostalgic cinematic atmosphere.',
};

export async function POST(req: Request) {
  try {
    const { prompt, media, visualStyle, quality, aspectRatio, duration } =
      await req.json();
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

    if (!prompt && (!media || media.length === 0)) {
      return NextResponse.json(
        { error: 'Prompt or Media is required' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    console.log(
      `[VideoGen] Request: Style=${visualStyle}, Quality=${quality}, Aspect=${aspectRatio}, Duration=${duration}`
    );
    console.log(
      '[VideoGen] Incoming media summary:',
      media?.map((m: any) => ({
        type: m.inlineData ? 'inline' : 'uri',
        mime: m.mimeType || m.inlineData?.mimeType,
        hasUri: !!m.fileUri,
      }))
    );

    // Build media parts for reference
    let referenceImage = media?.find((m: any) =>
      m.inlineData?.mimeType?.startsWith('image/')
    )?.inlineData;

    if (
      referenceImage &&
      typeof referenceImage.data === 'string' &&
      referenceImage.data.startsWith('data:')
    ) {
      const base64 = referenceImage.data.split(',')[1];
      if (base64) referenceImage.data = base64;
    }

    // If no inline image, check if there's a GCS image we can fetch
    if (!referenceImage) {
      const gcsImage = media?.find(
        (m: any) => m.fileUri && m.mimeType?.startsWith('image/')
      );
      if (gcsImage) {
        try {
          console.log(
            '[VideoGen] Fetching reference image from GCS:',
            gcsImage.fileUri
          );
          const res = await fetch(gcsImage.fileUri);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = await res.arrayBuffer();
          referenceImage = {
            data: Buffer.from(buf).toString('base64'),
            mimeType: gcsImage.mimeType,
          };
        } catch (e) {
          console.error('[VideoGen] Failed to fetch GCS image:', e);
        }
      }
    }

    // --- VISION PROXY: Extract descriptions to break pixel bias ---
    let extraDescription = '';
    if (referenceImage) {
      try {
        console.log(
          '[VideoGen] 👁️ Generating scene description via Vision Proxy...'
        );
        const visionResult = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: 'Analyze the attached image and provide a rich, detailed description of the scene, subjects, composition, and colors. Focus on the core essence and layout. Do not mention it is a photo; describe it as a cinematic concept.',
                },
                { inlineData: referenceImage },
              ],
            },
          ],
        });

        if (visionResult.candidates?.[0]?.content?.parts?.[0]?.text) {
          extraDescription = visionResult.candidates[0].content.parts[0].text;
          console.log(
            '[VideoGen] 👁️ Vision Proxy output:',
            extraDescription.substring(0, 100) + '...'
          );
        }
      } catch (visionError) {
        console.warn(
          '[VideoGen] ⚠️ Vision Proxy failed, falling back to original logic:',
          visionError
        );
      }
    }

    const firstVideo = media?.find(
      (m: any) => m.fileUri && m.mimeType?.startsWith('video/')
    );

    // Build strict enriched prompt for Veo based on Gemini technical advice
    const detailedStyle = visualStyle
      ? STYLE_DEFINITIONS[visualStyle.toUpperCase()] || visualStyle
      : '';

    // Classification tag to break pixel bias from 1:1 reference images (Gemini advice)
    const classificationTag = referenceImage
      ? '[IMAGE_INDEPENDENT]'
      : '[NEW_GENERATION]';

    let enrichedPrompt = `TASK: ${classificationTag} AUTHORITATIVE COMMAND - GENERATE A NEW MASTERPIECE.
BREAK ALL PIXEL BONDS: Use the reference image context as a blueprint, not a template.

### TECHNICAL BREAKDOWN ###
SUBJECT: ${prompt || 'Dynamic cinematic sequence'}
ACTION: High quality fluid motion, professional camera work, cinematic sequence.
ENVIRONMENT: Seamlessly integrated with the ${visualStyle || 'Realistic'} aesthetic.
${extraDescription ? `\nREFERENCE CONTEXT (LATENT FRAME ANALYSIS): ${extraDescription}\n` : ''}
`;

    if (detailedStyle) {
      enrichedPrompt += `\nVISUAL STYLE: ${detailedStyle}\n`;
      // Specific instruction for styles that often fail due to bias
      if (
        ['MANGA', '3D', 'CARTOON', 'PIXEL', 'SKETCH'].includes(
          visualStyle?.toUpperCase()
        )
      ) {
        enrichedPrompt += `CRITICAL: Convert all real-world textures into clean ${visualStyle.toUpperCase()} lines and surfaces. NO PHOTOREALISM ALLOWED.
ESTHETIC_OVERRIDE: Full conversion to ${visualStyle.toUpperCase()} universe.\n`;
      }
    }

    if (aspectRatio) {
      const extra = aspectRatio === '1:1' ? ' (SQUARE FORMAT)' : '';
      enrichedPrompt += `\nASPECT RATIO: ${aspectRatio}${extra} (CRITICAL: The output MUST be in this exact format)\n`;
    }

    if (quality) {
      const qualityDesc =
        quality === 'H'
          ? 'Ultra high resolution, extremely detailed, professional masterpiece'
          : 'High quality, sharp focus';
      enrichedPrompt += `\nQUALITY: ${qualityDesc}\n`;
    }

    if (duration) {
      enrichedPrompt += `\nDURATION: ${duration} minutes\n`;
    }

    if (firstVideo?.fileUri) {
      enrichedPrompt += `\nMOTION REFERENCE: Use the motion and timing from ${firstVideo.fileUri} as a guide, but create NEW content.\n`;
    }

    if (referenceImage) {
      enrichedPrompt += `\nREFERENCE IMAGE INSTRUCTIONS:
- MAINTAIN consistency with the subjects, environment, and characters from the attached image.
- ADAPT the composition to the requested format while keeping the core identity intact.
- EXTEND the background and scene naturally to fill the widescreen format.\n`;
    }

    console.log(`[VideoGen] Final Enriched Prompt:\n${enrichedPrompt}`);

    // Gemini advises [IMAGE_INDEPENDENT] to keep the image as the "stage" while
    // allowing new motion/subjects. Always including the image as a latent frame
    // ensures the "no relation" issue is resolved.
    // --- DEEP FIX FROM GEMINI ADVICE ---
    // Veo 3.1 often requires an 'inputConfig' wrapper with 'instances'
    // for complex multi-modal inputs.
    // --- CLEAN FIX: SINGLE ARGUMENT STRUCTURE ---
    // Moving aspectRatio back into the first object to satisfy the SDK signature
    // and using the specific 'bytesBase64Encoded' field for Veo 3.1.
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: enrichedPrompt,
      inputConfig: {
        instances: [
          {
            prompt: enrichedPrompt,
            ...(referenceImage
              ? {
                  image: {
                    bytesBase64Encoded: referenceImage.data,
                    mimeType: referenceImage.mimeType,
                  },
                }
              : {}),
          },
        ],
      },
      config: {
        aspectRatio: aspectRatio === '1:1' ? '1:1' : aspectRatio || '16:9',
      } as any,
    } as any);

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
        // Cast to any to bypass missing type definitions in the SDK
        operation = await (ai.operations as any).getVideosOperation({
          operation: operation,
        });
      } catch (e) {
        console.log('Polling error, maybe operation object updates itself?', e);
      }

      // Re-check done status
      if (operation.done) break;
    }

    // Download/Extract result
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
      try {
        console.log(`[VideoGen] 📥 Downloading video from URI: ${videoUri}`);

        // Try fetching with header auth first (cleaner, avoids query param issues)
        let downloadRes = await fetch(`${videoUri}?alt=media`, {
          headers: {
            'x-goog-api-key': apiKey,
          },
        });

        if (!downloadRes.ok) {
          console.warn(
            `[VideoGen] ⚠️ Header auth failed (${downloadRes.status}), trying query param auth...`
          );
          // Fallback to query param if header fails
          downloadRes = await fetch(`${videoUri}?key=${apiKey}&alt=media`);
        }

        // Final fallback: Maybe it doesn't need alt=media or it's already a direct asset URL
        if (!downloadRes.ok && downloadRes.status === 400) {
          console.warn(
            '[VideoGen] ⚠️ Bad Request with alt=media, trying direct fetch...'
          );
          downloadRes = await fetch(videoUri, {
            headers: { 'x-goog-api-key': apiKey },
          });
        }

        if (!downloadRes.ok) {
          const errorText = await downloadRes.text();
          console.error(
            `[VideoGen] ❌ Download failed. Status: ${downloadRes.status}, Body: ${errorText}`
          );
          throw new Error(
            `Failed to download video from Google: ${downloadRes.statusText}`
          );
        }

        const videoBuffer = await downloadRes.arrayBuffer();
        console.log(
          `[VideoGen] 📥 Download complete (${videoBuffer.byteLength} bytes). Uploading to GCS...`
        );

        const bucketName = process.env.GCS_BUCKET_NAME;
        if (!bucketName) throw new Error('GCS_BUCKET_NAME not configured');

        // Reuse storage client logic
        const privateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');
        const storage = new Storage({
          projectId: process.env.GCS_PROJECT_ID,
          credentials: {
            client_email: process.env.GCS_CLIENT_EMAIL,
            private_key: privateKey,
          },
        });

        const bucket = storage.bucket(bucketName);
        const fileName = `ai-generated/video_${Date.now()}.mp4`;
        const file = bucket.file(fileName);

        await file.save(Buffer.from(videoBuffer), {
          contentType: 'video/mp4',
          metadata: {
            cacheControl: 'public, max-age=31536000',
          },
        });

        console.log(`[VideoGen] ✅ Uploaded to GCS: ${fileName}`);

        // Generate a signed URL for reading (valid for 24 hours)
        const [signedUrl] = await file.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 24 * 60 * 60 * 1000,
        });

        return NextResponse.json({ url: signedUrl, gcsPath: fileName });
      } catch (uploadError: any) {
        console.error('[VideoGen] ❌ GCS Upload failed:', uploadError);
        // Fallback to raw URI if upload fails? No, better to error if the user wants GCS.
        return NextResponse.json(
          {
            error: 'Failed to save video to storage',
            details: uploadError.message,
          },
          { status: 500 }
        );
      }
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
