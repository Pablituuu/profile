const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testModels() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      await model.generateContent('test');
      console.log(`✅ ${modelName}: SUCCESS`);
    } catch (err) {
      console.log(`❌ ${modelName}: ${err.message.substring(0, 100)}`);
    }
  }
}

testModels().catch(console.error);
