export const maxDuration = 300;
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
    try {
        const { context, unitText } = await req.json();
        const textToProcess = context || unitText;

        if (!textToProcess || textToProcess.trim() === '') {
            return NextResponse.json({ error: "Missing context text." }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        const prompt = `You are a strict data extraction tool.
I am providing you with a chunk of raw text from a Study Guide.
Your job is to identify ONLY the top 5 to 10 most critical, high-yield "Question / Answer" or "Concept / Definition" pairs from the text.
Do NOT extract trivial details. Focus purely on major, core concepts that are absolutely essential for an exam.

Keep the "front" (the question or concept name) short and clear.
Keep the "back" (the answer or definition) concise (1-2 sentences).

Input Text:
"""
${textToProcess}
"""

Output JSON EXACTLY adhering to this schema:
[
  { "id": "uuid-1", "front": "Concept Name", "back": "Concept Definition" },
  { "id": "uuid-2", "front": "Question", "back": "Answer" }
]
`;

        const result = await model.generateContent(prompt);
        let rawJson = result.response.text();

        // Robust extraction: Find the first '[' and last ']' to guarantee valid JSON array parsing.
        const arrayStart = rawJson.indexOf('[');
        const arrayEnd = rawJson.lastIndexOf(']');
        if (arrayStart !== -1 && arrayEnd !== -1) {
            rawJson = rawJson.substring(arrayStart, arrayEnd + 1);
        }

        const flashcards = JSON.parse(rawJson);
        return NextResponse.json(flashcards);

    } catch (error) {
        console.error("Error extracting flashcards:", error);
        return NextResponse.json({ error: "Failed to extract flashcards", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
