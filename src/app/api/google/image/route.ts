import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server Configuration Error: Missing GOOGLE_KI' },
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

    // Using the exact model name from the user's screenshot: Nano Banana
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      config: {
        // Optional: You can specify aspect ratio here if supported by this specific model/SDK version
        // Screenshot didn't explicitly show config for aspect ratio but implied control.
        // Defaulting to just prompt for now.
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      );
    }

    // The screenshot shows iterating through parts to find inlineData (image)
    // const part = response.candidates[0].content.parts[0]; // Logic from screenshot
    // but the screenshot iterates. Let's find the image part.

    const parts = candidates[0].content?.parts;
    let base64Image = null;

    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Image) {
      // Fallback: check if it returned text saying it can't do it
      const textPart = parts?.find((p: any) => p.text);
      if (textPart) {
        console.error('Gemini returned text instead of image:', textPart.text);
        return NextResponse.json(
          {
            error: 'Model returned text instead of image',
            details: textPart.text,
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: 'No image data found in response' },
        { status: 500 }
      );
    }

    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    return NextResponse.json({ url: dataUrl });
  } catch (error: any) {
    console.error('Gemini Image Gen Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
