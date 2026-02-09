import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const STYLE_DEFINITIONS: Record<string, string> = {
  REALISTIC:
    'Extreme photorealism, shot on 35mm lens, f/1.8, cinematic depth of field, hyper-detailed skin textures, natural 8k lighting, global illumination, Ray Tracing, professional photography architecture.',
  MANGA:
    'High-end Anime Studio Ghibli and MAPPA style, crisp line art, vibrant cel-shading, cinematic anime lighting, expressive features, masterpiece quality, 8k resolution anime illustration.',
  CINEMATIC:
    'Hollywood movie still, anamorphic lens flares, teal and orange color grading, dramatic chiaroscuro lighting, volumetric fog, highly detailed IMAX quality, 8k cinematic masterpiece.',
  '3D': 'High-end Octane Render, Unreal Engine 5 aesthetic, Ray Traced reflections, subsurface scattering, polished 3D textures, digital masterpiece, 4k digital art, soft shadows.',
  CARTOON:
    'Professional vector illustration, Disney/Pixar modern style, smooth gradients, bold playful character design, vibrant clean colors, high-end commercial animation look.',
  PIXEL:
    'Masterpiece pixel art, 32-bit console aesthetic, sharp distinct pixels, vibrant retro palette, clean grid alignment, high-end indie game art style.',
  WATERCOLOR:
    'Professional fluid watercolor painting, rough paper texture, delicate hand-painted washes, artistic ink splatters, soft blended edges, masterpiece traditional art.',
  OIL: 'Masterpiece oil on canvas, heavy impasto brushstrokes, rich physical paint texture, dramatic baroque lighting, classic fine art gallery quality, vibrant oil colors.',
  OIL_PAINTING:
    'Masterpiece oil on canvas, heavy impasto brushstrokes, rich physical paint texture, dramatic baroque lighting, classic fine art gallery quality, vibrant oil colors.',
  CYBERPUNK:
    'Neon-drenched futuristic aesthetic, Blade Runner style, wet street reflections, volumetric purple and blue lighting, high-tech low-life, hyper-detailed mechanical parts.',
  SKETCH:
    'Professional graphite pencil drawing, fine cross-hatching, charcoal shading, hand-drawn artistic feel, high-quality white grain paper, raw masterpiece sketch.',
  VINTAGE:
    'Authentic 1970s film grain technique, Kodak Portra 400 aesthetic, warm nostalgia, natural light leaks, faded retro colors, professional analog photography.',
};

export async function POST(req: Request) {
  try {
    const { prompt, media, visualStyle, quality, aspectRatio } =
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
      `[ImageGen] Request: Style=${visualStyle}, Quality=${quality}, Aspect=${aspectRatio}`
    );
    console.log(
      '[ImageGen] Incoming media summary:',
      media?.map((m: any) => ({
        type: m.inlineData ? 'inline' : 'uri',
        mimeType: m.inlineData?.mimeType || m.mimeType,
        hasUri: !!m.fileUri,
      }))
    );

    // Filter only images (gemini-2.5-flash-image does NOT support video)
    const hasVideos = media?.some((m: any) =>
      (m.inlineData?.mimeType || m.mimeType || '').startsWith('video/')
    );

    if (hasVideos) {
      console.warn(
        '[ImageGen] ⚠️ Videos detected in media. gemini-2.5-flash-image only supports images. Videos will be ignored.'
      );
    }

    const imageOnlyMedia =
      media?.filter((m: any) => {
        const mimeType = m.inlineData?.mimeType || m.mimeType || '';
        return mimeType.startsWith('image/');
      }) || [];

    console.log(`[ImageGen] Filtered to ${imageOnlyMedia.length} image(s)`);

    // Build media parts for multimodal input (images only)
    const mediaParts: any[] = [];

    for (const m of imageOnlyMedia) {
      if (m.inlineData) {
        let data = m.inlineData.data;
        // Strip data URL prefix if present
        if (typeof data === 'string' && data.startsWith('data:')) {
          data = data.split(',')[1];
        }
        mediaParts.push({
          inlineData: {
            data: data,
            mimeType: m.inlineData.mimeType,
          },
        });
      } else if (m.fileUri) {
        try {
          console.log(`[ImageGen] Fetching: ${m.fileUri}`);
          const res = await fetch(m.fileUri);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = await res.arrayBuffer();
          mediaParts.push({
            inlineData: {
              data: Buffer.from(buf).toString('base64'),
              mimeType: m.mimeType || 'image/jpeg',
            },
          });
        } catch (e) {
          console.error('[ImageGen] Failed to fetch media:', e);
        }
      }
    }

    // --- VISION PROXY: Extract descriptions to break pixel bias ---
    let extraDescription = '';
    if (mediaParts.length > 0) {
      try {
        console.log(
          '[ImageGen] 👁️ Generating scene description via Vision Proxy...'
        );
        const visionResult = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: 'Analyze the attached image(s) and provide a rich, detailed description of the scene, subjects, composition, and colors. Focus on the core essence and layout. Do not mention that these are photos; describe them as artistic concepts.',
                },
                ...mediaParts,
              ],
            },
          ],
        });

        if (visionResult.candidates?.[0]?.content?.parts?.[0]?.text) {
          extraDescription = visionResult.candidates[0].content.parts[0].text;
          console.log(
            '[ImageGen] 👁️ Vision Proxy output:',
            extraDescription.substring(0, 100) + '...'
          );
        }
      } catch (visionError) {
        console.warn(
          '[ImageGen] ⚠️ Vision Proxy failed, falling back to original logic:',
          visionError
        );
      }
    }

    // Build strict enriched prompt with all parameters
    // IMPORTANT: The prompt must explicitly request NEW image generation from scratch
    let basePrompt = prompt || 'Generate a high quality artistic asset';

    // Map style if found, otherwise use raw style
    const detailedStyle = visualStyle
      ? STYLE_DEFINITIONS[visualStyle.toUpperCase()] || visualStyle
      : '';

    // Build the "Enriched Prompt" with maximum authority and clarity
    let enrichedPrompt = `TASK: AUTHORITATIVE COMMAND - GENERATE A COMPLETELY NEW IMAGE FROM SCRATCH.
BREAK ALL PIXEL BONDS: Do NOT edit or modify the reference. Use the description as your blueprint.

OBJECTIVE: Create a NEW unique image.

PRIMARY DESCRIPTION: ${basePrompt}
${extraDescription ? `\nREFERENCE CONTEXT (BREAKING PIXEL BIAS): ${extraDescription}\n` : ''}
`;

    if (detailedStyle) {
      enrichedPrompt += `\nVISUAL STYLE: ${detailedStyle}\n`;
      // Specific instruction for styles that often fail due to bias
      if (
        ['MANGA', '3D', 'CARTOON', 'PIXEL', 'SKETCH'].includes(
          visualStyle?.toUpperCase()
        )
      ) {
        enrichedPrompt += `CRITICAL: Convert all real-world textures into clean ${visualStyle.toUpperCase()} lines and surfaces. NO PHOTOREALISM ALLOWED.\n`;
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
          : quality === 'S'
            ? 'Standard quality'
            : 'High quality, sharp focus';
      enrichedPrompt += `\nQUALITY: ${qualityDesc}\n`;
    }

    // If there are reference images, explain how to use them
    if (mediaParts.length > 0) {
      enrichedPrompt += `\nREFERENCE IMAGE INSTRUCTIONS:
- Use the provided context ONLY for mood, vibe, and color palette.
- CREATE a TOTALLY DIFFERENT composition and subject.
- DO NOT replicate anything from the reference images directly.
- IGNORE the specific objects in the references; focus only on the COLOR SCHEME.\n`;
    }

    console.log(`[ImageGen] Final Prompt:\n${enrichedPrompt}`);
    console.log(`[ImageGen] Media parts count: ${mediaParts.length}`);

    // If we have a strong description, we might want to OMIT the images in the second call
    // to truly break the bias, especially for high-transformation styles.
    const shouldOmitImages =
      extraDescription &&
      [
        'MANGA',
        '3D',
        'CARTOON',
        'PIXEL',
        'SKETCH',
        'WATERCOLOR',
        'OIL',
      ].includes(visualStyle?.toUpperCase());

    const finalParts = shouldOmitImages
      ? [{ text: enrichedPrompt }]
      : [{ text: enrichedPrompt }, ...mediaParts];
    if (shouldOmitImages) {
      console.log(
        '[ImageGen] 🚀 Omitting reference images from final generation to ensure total style transformation (Breaking Pixel Bias).'
      );
    }

    // Use gemini-2.5-flash-image for image generation (official model)
    // Pass strict parameters in the config object for better adherence
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          role: 'user',
          parts: finalParts,
        },
      ],
      config: {
        responseModalities: ['image', 'text'],
        // Strict parameter injection via API config (using technical keys for the model)
        ...(aspectRatio
          ? { aspectRatio: aspectRatio, aspect_ratio: aspectRatio }
          : {}),
        ...(quality ? { quality: quality === 'H' ? 'hd' : 'standard' } : {}),
      },
    });

    console.log(
      '[ImageGen] Response received. Candidates:',
      response.candidates?.length
    );

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { error: 'No response from model' },
        { status: 500 }
      );
    }

    // Find image in response parts
    const parts = candidates[0].content?.parts;
    let imageData: string | null = null;
    let imageMimeType = 'image/png';

    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
          imageData = part.inlineData.data || null;
          imageMimeType = part.inlineData.mimeType;
          break;
        }
      }
    }

    if (!imageData) {
      // Check if model returned text instead
      const textPart = parts?.find((p: any) => p.text);
      if (textPart) {
        console.error('[ImageGen] Model returned text:', textPart.text);
        return NextResponse.json(
          {
            error: 'Model returned text instead of image',
            details: textPart.text,
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: 'No image data in response' },
        { status: 500 }
      );
    }

    // Convert base64 to buffer for blob info
    const imageBuffer = Buffer.from(imageData, 'base64');
    const imageSizeKB = (imageBuffer.length / 1024).toFixed(2);
    const imageSizeMB = (imageBuffer.length / (1024 * 1024)).toFixed(2);

    console.log(`[ImageGen] ✅ Image generated successfully!`);
    console.log(`[ImageGen] Image MIME type: ${imageMimeType}`);
    console.log(`[ImageGen] Image size: ${imageSizeKB} KB (${imageSizeMB} MB)`);
    console.log(`[ImageGen] Base64 length: ${imageData.length} chars`);
    console.log(`[ImageGen] Buffer length: ${imageBuffer.length} bytes`);
    console.log(`[ImageGen] Blob info:`, {
      type: imageMimeType,
      size: imageBuffer.length,
      sizeKB: `${imageSizeKB} KB`,
      sizeMB: `${imageSizeMB} MB`,
    });

    const dataUrl = `data:${imageMimeType};base64,${imageData}`;

    console.log(
      `[ImageGen] 📤 Returning data URL (length: ${dataUrl.length} chars)`
    );
    console.log(
      `[ImageGen] 📤 Data URL preview: ${dataUrl.substring(0, 200)}...`
    );

    return NextResponse.json({ url: dataUrl });
  } catch (error: any) {
    console.error('[ImageGen] Error:', error);
    return NextResponse.json(
      { error: 'Image generation failed', details: error.message },
      { status: 500 }
    );
  }
}
