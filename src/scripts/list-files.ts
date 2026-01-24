import { GoogleGenAI } from "@google/genai";

async function listFiles() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log("Listing files from Google AI...");
  // Based on @google/genai SDK
  try {
    const listFilesResponse = await (ai as any).files.list();
    if (listFilesResponse.files) {
      for (const file of listFilesResponse.files) {
        console.log(`- ${file.displayName} (${file.name}): ${file.uri}`);
      }
    } else {
      console.log("No files found.");
    }
  } catch (e) {
    console.error("Error listing files:", e);
  }
}

listFiles();
