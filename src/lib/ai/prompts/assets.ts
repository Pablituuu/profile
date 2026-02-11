import { ChatPromptTemplate } from '@langchain/core/prompts';

export const ASSET_STYLE_DEFINITIONS: Record<string, string> = {
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
  CYBERPUNK:
    'Neon-drenched futuristic aesthetic, Blade Runner style, wet street reflections, volumetric purple and blue lighting, high-tech low-life, hyper-detailed mechanical parts.',
  SKETCH:
    'Professional graphite pencil drawing, fine cross-hatching, charcoal shading, hand-drawn artistic feel, high-quality white grain paper, raw masterpiece sketch.',
  VINTAGE:
    'Authentic 1970s film grain technique, Kodak Portra 400 aesthetic, warm nostalgia, natural light leaks, faded retro colors, professional analog photography.',
};

/**
 * Prompt for the Vision Proxy: Analyzes reference images to help generate new assets.
 */
export const ASSET_VISION_PROXY_PROMPT = ChatPromptTemplate.fromMessages([
  [
    'system',
    'You are a visual analyst at Pablituuu Studio. Analyze the provided image(s) to extract the core essence, composition, and palette.',
  ],
  [
    'user',
    'Analyze the attached image(s) and provide a rich, detailed description of the scene, subjects, composition, and colors. Focus on the core essence and layout. Do not mention that these are photos; describe them as artistic concepts.',
  ],
]);

/**
 * Prompt for final asset enrichment.
 */
export const ASSET_ENRICHMENT_PROMPT = ChatPromptTemplate.fromMessages([
  [
    'system',
    'You are an expert creative director. Transform user ideas into professional generative prompts.',
  ],
  [
    'user',
    `TASK: GENERATE A COMPLETELY NEW ASSET FROM SCRATCH.
    
    PRIMARY DESCRIPTION: {prompt}
    {visionContext}
    
    VISUAL STYLE: {styleDescription}
    ASPECT RATIO: {aspectRatio}
    QUALITY: {qualityDescription}
    
    INSTRUCTIONS:
    - {styleForceInstruction}
    - Break all pixel bonds with any reference images.
    - Create a unique composition.`,
  ],
]);
