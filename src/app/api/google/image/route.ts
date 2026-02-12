import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { geminiFlash } from '@/lib/ai/clients';
import { HumanMessage } from '@langchain/core/messages';
import {
  ASSET_STYLE_DEFINITIONS,
  ASSET_VISION_PROXY_PROMPT,
  ASSET_ENRICHMENT_PROMPT,
} from '@/lib/ai/prompts/assets';

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
        const visionPrompt = await ASSET_VISION_PROXY_PROMPT.format({});

        const message = new HumanMessage({
          content: [
            {
              type: 'text',
              text: visionPrompt,
            },
            ...mediaParts.map((p) => ({
              type: 'image_url',
              image_url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`,
            })),
          ],
        });

        const visionResult = await geminiFlash.invoke([message]);

        if (visionResult.content) {
          extraDescription = visionResult.content as string;
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

    // Build strict enriched prompt with LangChain template
    const styleDescription = visualStyle
      ? ASSET_STYLE_DEFINITIONS[visualStyle.toUpperCase()] || visualStyle
      : 'Professional digital art';

    const qualityDescription =
      quality === 'H'
        ? 'Ultra high resolution, extremely detailed, professional masterpiece'
        : quality === 'S'
          ? 'Standard quality'
          : 'High quality, sharp focus';

    const visionContext = extraDescription
      ? `\nREFERENCE CONTEXT: ${extraDescription}\n`
      : '';

    const styleForceInstruction = [
      'MANGA',
      '3D',
      'CARTOON',
      'PIXEL',
      'SKETCH',
    ].includes(visualStyle?.toUpperCase())
      ? `CRITICAL: Convert all textures into clean ${visualStyle.toUpperCase()} lines and surfaces. NO PHOTOREALISM ALLOWED.`
      : visualStyle?.toUpperCase() === 'SCIENTIFIC_GLOW'
        ? "INTEGRATION: The glowing nerves are NOT painted on the skin. They are internal, emissive fibers embedded deep inside the body. Use heavy 'volumetric lighting' and 'subsurface scattering' to render the glow coming from within."
        : 'Maintain high artistic quality and identity.';

    const pixelBiasInstruction = ['REALISTIC', 'VINTAGE'].includes(
      visualStyle?.toUpperCase()
    )
      ? 'Maintain strong composition and structural fidelity from the reference images. Focus on identity and realism. Preserve the layout perfectly.'
      : visualStyle?.toUpperCase() === 'SCIENTIFIC_GLOW'
        ? 'TRANSFORMATION: Focus ONLY on the primary subjects from the reference images (animals, people, or objects). Replace the background with a cinematic, high-tech, or medical environment. Break the structural layout of the background completely while keeping the subjects.'
        : 'Break all pixel bonds with any reference images. Create something completely transformative while keeping the essence.';

    const enrichedPrompt = await ASSET_ENRICHMENT_PROMPT.format({
      prompt: prompt || 'Generate a high quality artistic asset',
      visionContext,
      styleDescription,
      aspectRatio: aspectRatio || '16:9',
      qualityDescription,
      styleForceInstruction,
      pixelBiasInstruction,
    });

    console.log(`[ImageGen] Final LangChain Prompt:\n${enrichedPrompt}`);
    console.log(`[ImageGen] Media parts count: ${mediaParts.length}`);

    // If we have a strong description, we might want to OMIT the images in the second call
    // to truly break the bias, especially for high-transformation styles.
    const shouldOmitImages =
      extraDescription &&
      ['MANGA', '3D', 'CARTOON', 'PIXEL', 'SKETCH', 'SCIENTIFIC_GLOW'].includes(
        visualStyle?.toUpperCase()
      );

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
