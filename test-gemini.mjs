import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
        generationConfig: {
            responseMimeType: "application/json",
        },
    });
    
    const result = await model.generateContent("Give me a JSON array of 1 object.");
    console.log(result.response.text());
  } catch (e) {
    console.error("FAILED:", e);
  }
}
test();
