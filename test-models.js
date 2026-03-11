import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
dotenv.config({ path: '.env.local' });

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTest = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-2.5-flash', 'gemini-1.0-pro'];
  
  for (const m of modelsToTest) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContentStream('Hello');
//      const result = await model.generateContent('Hello');
// Try streaming specifically since that was the error in the screenshot!
      
      let chunkCount = 0;
      for await (const chunk of result.stream) {
          if (chunk) chunkCount++;
      }
      console.log(`[SUCCESS] ${m} (Streaming supported, got ${chunkCount} chunks)`);
    } catch (e) {
      console.log(`[FAILED] ${m}: ${e.message.split('\n')[0].substring(0, 100)}`);
    }
  }
}
test();
