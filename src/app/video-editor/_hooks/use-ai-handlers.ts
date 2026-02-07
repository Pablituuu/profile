import { useCallback } from 'react';
import { Text, Image, Video, IClip, Studio } from 'openvideo';

interface TextStyle {
  fontSize?: number;
  fill?: string;
  fontWeight?: string;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  color?: string;
  [key: string]: unknown;
}

interface MediaStyle {
  borderRadius?: number;
  stroke?: {
    color?: string;
    width?: number;
  };
  dropShadow?: {
    color?: string;
    alpha?: number;
    blur?: number;
    distance?: number;
    angle?: number;
  };
  [key: string]: unknown;
}

interface MediaClip extends IClip {
  style: MediaStyle;
  volume: number;
}

/**
 * Interface for clips that support text content and direct updates.
 */
interface TextClip extends IClip {
  text?: string;
  style: TextStyle;
}

export const useAiHandlers = (studio: Studio | null) => {
  const handleAddText = useCallback(
    async (input: {
      text: string;
      fontSize?: number;
      color?: string;
      fontWeight?: string;
    }) => {
      if (!studio) return;

      try {
        const textClip = new Text(input.text, {
          fontSize: input.fontSize,
          fontFamily: 'Arial',
          align: 'center',
          fontWeight: input.fontWeight,
          fontStyle: 'normal',
          fill: input.color,
          wordWrap: true,
          wordWrapWidth: 800,
        });
        await textClip.ready;
        textClip.display.from = 0;
        textClip.duration = 5e6;
        textClip.display.to = 5e6;
        await studio.addClip(textClip);
        console.log('Text clip added via dispatcher');
      } catch (error: unknown) {
        console.error('Failed to add text via hook:', error);
      }
    },
    [studio]
  );

  const handleGenerateImage = useCallback(
    async (input: { prompt: string }) => {
      if (!studio) return;

      try {
        console.log('Generating image with prompt:', input.prompt);
        // Call internal API route to generate image via Google Nano Banana
        const response = await fetch('/api/google/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: input.prompt }),
        });

        if (!response.ok) {
          throw new Error(`Generation failed: ${response.statusText}`);
        }

        const data = await response.json();
        const imageUrl = data.url;

        if (!imageUrl) {
          throw new Error('No image URL returned from API');
        }

        const imageClip = await Image.fromUrl(imageUrl);
        // Cast to any to set name if it's not on the interface
        (imageClip as any).name = input.prompt;

        await imageClip.ready;
        imageClip.display = { from: 0, to: 5 * 1e6 };
        imageClip.duration = 5 * 1e6;

        await studio.addClip(imageClip);
        console.log('Generated image added via dispatcher:', imageUrl);
      } catch (error: unknown) {
        console.error('Failed to generate image via hook:', error);
      }
    },
    [studio]
  );

  const handleGenerateVideo = useCallback(
    async (input: { prompt: string }) => {
      if (!studio) return;

      try {
        console.log('Generating video with prompt:', input.prompt);
        // Call internal API route to generate video via Google Veo
        const response = await fetch('/api/google/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: input.prompt }),
        });

        if (!response.ok) {
          throw new Error(`Video generation failed: ${response.statusText}`);
        }

        const data = await response.json();
        const videoUrl = data.url;

        if (!videoUrl) {
          throw new Error('No video URL returned from API');
        }

        const videoClip = await Video.fromUrl(videoUrl);
        // Cast to any to set name if it's not on the interface
        (videoClip as any).name = input.prompt;

        await videoClip.ready;
        // Default video duration if not set by metadata
        // Video.fromUrl loads a video clip. Its duration should be populated.
        // We ensure it has a display range.
        videoClip.display = { from: 0, to: videoClip.duration };

        await studio.addClip(videoClip);
        console.log('Generated video added via dispatcher:', videoUrl);
      } catch (error: unknown) {
        console.error('Failed to generate video via hook:', error);
      }
    },
    [studio]
  );

  const handleUpdateTextStyle = useCallback(
    async (input: {
      text?: string;
      fontSize?: number;
      color?: string;
      fontWeight?: string;
      textAlign?: 'left' | 'center' | 'right';
      opacity?: number;
    }) => {
      if (!studio) return;

      const selectedClips = studio.getSelectedClips();

      if (!selectedClips.length) {
        return;
      }

      try {
        selectedClips.forEach((clip) => {
          if (clip.type.toLowerCase() === 'text') {
            const textClip = clip as TextClip;
            const updates: Partial<TextClip> = {};
            const styleUpdates: TextStyle = {};

            if (input.text !== undefined) updates.text = input.text;
            if (input.opacity !== undefined) updates.opacity = input.opacity;

            if (input.fontSize !== undefined)
              styleUpdates.fontSize = input.fontSize;
            if (input.color !== undefined) {
              styleUpdates.fill = input.color;
            }
            if (input.fontWeight !== undefined)
              styleUpdates.fontWeight = input.fontWeight;
            if (input.textAlign !== undefined)
              styleUpdates.align = input.textAlign;

            if (Object.keys(styleUpdates).length > 0) {
              updates.style = {
                ...(textClip.style || {}),
                ...styleUpdates,
              };
            }

            // Remove undefined or null values to avoid issues with the editor
            const cleanUpdates = Object.fromEntries(
              Object.entries(updates).filter(([_, v]) => v != null)
            );

            if (cleanUpdates.style) {
              cleanUpdates.style = Object.fromEntries(
                Object.entries(cleanUpdates.style).filter(([_, v]) => v != null)
              );
            }

            console.log(
              `Updating clip ${textClip.id} via dispatcher with:`,
              cleanUpdates
            );
            textClip.update(cleanUpdates);
          }
        });
      } catch (error: unknown) {
        console.error('Failed to update style via hook:', error);
      }
    },
    [studio]
  );

  const handleUpdateMediaStyle = useCallback(
    async (input: {
      opacity?: number;
      left?: number;
      top?: number;
      width?: number;
      height?: number;
      angle?: number;
      borderRadius?: number;
      volume?: number;
      strokeColor?: string;
      strokeWidth?: number;
      shadowDistance?: number;
      shadowAngle?: number;
      shadowBlur?: number;
      shadowColor?: string;
    }) => {
      if (!studio) return;

      const selectedClips = studio.getSelectedClips();
      if (!selectedClips.length) return;

      try {
        selectedClips.forEach((clip) => {
          const type = clip.type.toLowerCase();
          if (type === 'image' || type === 'video') {
            const mediaClip = clip as MediaClip;
            const updates: any = {};
            const styleUpdates: any = { ...(mediaClip.style || {}) };

            const angle =
              input.angle !== undefined ? input.angle : (input as any).rotation;
            const borderRadius =
              input.borderRadius !== undefined
                ? input.borderRadius
                : (input as any).cornerRadius;

            let shadowColor = input.shadowColor;
            let shadowBlur = input.shadowBlur;
            let shadowDistance = input.shadowDistance;
            let shadowAngle = input.shadowAngle;

            // Handle CSS shadow string alias if present
            const cssShadow = (input as any).shadow;
            if (cssShadow && typeof cssShadow === 'string') {
              const parts = cssShadow.split(' ');
              if (parts.length >= 3) {
                shadowDistance = parseInt(parts[0]) || 5;
                shadowBlur = parseInt(parts[2]) || 10;
                const colorMatch = cssShadow.match(
                  /(rgba?\(.*?\)|#[0-9a-fA-F]{3,6})/
                );
                if (colorMatch) shadowColor = colorMatch[0];
              }
            }

            if (input.opacity !== undefined) updates.opacity = input.opacity;
            if (input.left !== undefined) updates.left = input.left;
            if (input.top !== undefined) updates.top = input.top;
            if (input.width !== undefined) updates.width = input.width;
            if (input.height !== undefined) updates.height = input.height;
            if (angle !== undefined) updates.angle = angle;

            if (type === 'video' && input.volume !== undefined) {
              updates.volume = input.volume;
            }

            if (borderRadius !== undefined) {
              styleUpdates.borderRadius = Math.max(1, borderRadius);
            }

            if (
              input.strokeColor !== undefined ||
              input.strokeWidth !== undefined
            ) {
              styleUpdates.stroke = {
                ...(styleUpdates.stroke || { color: '#ffffff', width: 0 }),
                ...(input.strokeColor !== undefined
                  ? { color: input.strokeColor }
                  : {}),
                ...(input.strokeWidth !== undefined
                  ? { width: input.strokeWidth }
                  : {}),
              };
            }

            if (
              shadowDistance !== undefined ||
              shadowAngle !== undefined ||
              shadowBlur !== undefined ||
              shadowColor !== undefined
            ) {
              const currentShadow = styleUpdates.dropShadow || {
                color: '#000000',
                alpha: 1,
                blur: 0,
                distance: 0,
                angle: 0,
              };

              styleUpdates.dropShadow = {
                ...currentShadow,
                ...(shadowColor !== undefined ? { color: shadowColor } : {}),
                ...(shadowBlur !== undefined ? { blur: shadowBlur } : {}),
                ...(shadowDistance !== undefined
                  ? { distance: shadowDistance }
                  : {}),
                ...(shadowAngle !== undefined
                  ? { angle: (shadowAngle * Math.PI) / 180 }
                  : {}),
              };
            }

            updates.style = styleUpdates;

            // Remove undefined or null values
            const cleanUpdates = Object.fromEntries(
              Object.entries(updates).filter(([_, v]) => v != null)
            );

            if (cleanUpdates.style) {
              cleanUpdates.style = Object.fromEntries(
                Object.entries(cleanUpdates.style).filter(([_, v]) => v != null)
              );
            }

            console.log(
              `Updating ${type} clip ${mediaClip.id} with:`,
              cleanUpdates
            );
            mediaClip.update(cleanUpdates);
          }
        });
      } catch (error) {
        console.error('Failed to update media style via hook:', error);
      }
    },
    [studio]
  );

  const handleToolCall = useCallback(
    async (toolCall: { toolName: string; input: unknown }) => {
      const { toolName, input } = toolCall as { toolName: string; input: any };
      console.log('Dispatching AI Tool:', toolName, input);

      let payload = input;
      if (input.json) {
        try {
          payload = JSON.parse(input.json);
          console.log('Parsed Tool Payload:', payload);
        } catch (e) {
          console.error('Failed to parse tool JSON:', input.json, e);
        }
      } else if (input.updates) {
        payload = input.updates;
      }

      switch (toolName) {
        case 'addText':
          return await handleAddText(payload);
        case 'generateImage':
          return await handleGenerateImage(payload);
        case 'generateVideo':
          return await handleGenerateVideo(payload);
        case 'updateSelectedTextStyle':
          return await handleUpdateTextStyle(payload);
        case 'updateSelectedMediaStyle':
          return await handleUpdateMediaStyle(payload);
        default:
          console.warn(`No handler for tool: ${toolName}`);
      }
    },
    [
      handleAddText,
      handleGenerateImage,
      handleGenerateVideo,
      handleUpdateTextStyle,
      handleUpdateMediaStyle,
    ]
  );

  return { handleToolCall };
};
