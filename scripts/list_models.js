const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("API Key missing");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const result = await genAI.listModels();
  console.log(JSON.stringify(result, null, 2));
}

listModels().catch(console.error);
