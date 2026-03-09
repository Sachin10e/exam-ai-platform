import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    try {
        const { unitText } = await req.json();

        if (!unitText) {
            return NextResponse.json({ error: "Missing unitText in request body" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-lite-latest",
            generationConfig: {
                // Force Gemini to return a strict JSON Array
                responseMimeType: "application/json",
            },
        });

        // Instruct Gemini on the exact schema shape we need for the Mock Exam component.
        const prompt = `You are an expert exam creator.
Convert the following study plan text into an array of 5 to 7 high-quality multiple choice questions.
Return ONLY a valid JSON array of objects.
Each object must match this exact schema:
[
  {
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": a number from 0 to 3,
    "explanation": "A short, engaging explanation of why this answer is correct."
  }
]

Do not include markdown ticks \`\`\`json. Return pure raw JSON.

Study text to extract from:
${unitText}`;

        const result = await model.generateContent(prompt);
        let rawResponse = result.response.text().trim();

        // Strip out markdown ticks if the AI still stubbornly included them
        if (rawResponse.startsWith('```json')) {
            rawResponse = rawResponse.substring(7);
        }
        if (rawResponse.endsWith('```')) {
            rawResponse = rawResponse.substring(0, rawResponse.length - 3);
        }

        const questionsJson = JSON.parse(rawResponse.trim());
        return NextResponse.json(questionsJson);

    } catch (error) {
        console.error("Error generating mock exam:", error);
        return NextResponse.json(
            { error: "Failed to generate mock exam", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
