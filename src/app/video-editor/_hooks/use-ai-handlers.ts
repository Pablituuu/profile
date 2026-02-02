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
      console.log('handleUpdateTextStyle dispatcher input:', input);

      if (!selectedClips.length) {
        console.warn('No clips selected for AI update.');
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
              styleUpdates.color = input.color;
            }
            if (input.fontWeight !== undefined)
              styleUpdates.fontWeight = input.fontWeight;
            if (input.textAlign !== undefined)
              styleUpdates.align = input.textAlign;

            if (Object.keys(styleUpdates).length > 0) {
              updates.style = styleUpdates;
            }

            console.log(
              `Updating clip ${textClip.id} via dispatcher with:`,
              updates
            );
            textClip.update(updates);
          }
        });
      } catch (error: unknown) {
        console.error('Failed to update style via hook:', error);
      }
    },
    [studio]
  );

  const handleToolCall = useCallback(
    async (toolCall: { toolName: string; input: unknown }) => {
      const { toolName, input } = toolCall;
      console.log('Dispatching AI Tool:', toolName, input);

      switch (toolName) {
        case 'addText':
          return await handleAddText(
            input as {
              text: string;
              fontSize?: number;
              color?: string;
              fontWeight?: string;
            }
          );
        case 'generateImage':
          return await handleGenerateImage(input as { prompt: string });
        case 'generateVideo':
          return await handleGenerateVideo(input as { prompt: string });
        case 'updateSelectedTextStyle':
          return await handleUpdateTextStyle(
            input as {
              text?: string;
              fontSize?: number;
              color?: string;
              fontWeight?: string;
              textAlign?: 'left' | 'center' | 'right';
              opacity?: number;
            }
          );
        default:
          console.warn(`No handler for tool: ${toolName}`);
      }
    },
    [
      handleAddText,
      handleGenerateImage,
      handleGenerateVideo,
      handleUpdateTextStyle,
    ]
  );

  return { handleToolCall };
};
