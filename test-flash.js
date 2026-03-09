require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
        },
    });

    const prompt = `Test prompt`;
    console.log("Generating...");
    const result = await model.generateContent(prompt);
    console.log("Result:", result.response.text());
  } catch(e) {
    console.error("ERROR CAUGHT:");
    console.error(e);
  }
}
test();
