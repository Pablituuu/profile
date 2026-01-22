"use server";

export async function checkGeminiApiKey() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  return !!key && key.length > 0;
}
