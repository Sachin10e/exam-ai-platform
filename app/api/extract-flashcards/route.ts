import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
    try {
        const { unitText } = await req.json();

        if (!unitText || unitText.trim() === '') {
            return NextResponse.json({ error: "Missing unit text." }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-lite-latest",
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        const prompt = `You are a strict data extraction tool.
I am providing you with a chunk of raw text from a Study Guide.
Your job is to identify every single logical "Question / Answer" pair or "Concept / Definition" pair and extract them into a JSON array of flashcards.

Extract ANY important concept you find into a flashcard format.
Keep the "front" (the question or concept name) short and clear.
Keep the "back" (the answer or definition) concise (1-2 sentences).

Input Text:
"""
${unitText}
"""

Output JSON EXACTLY adhering to this schema:
[
  { "id": "uuid-1", "front": "Concept Name", "back": "Concept Definition" },
  { "id": "uuid-2", "front": "Question", "back": "Answer" }
]
`;

        const result = await model.generateContent(prompt);
        let rawJson = result.response.text();

        // Sometimes the model wraps the JSON in markdown code blocks even with responseMimeType set.
        if (rawJson.startsWith('```json')) {
            rawJson = rawJson.replace(/^```json\n/, '').replace(/\n```$/, '');
        }

        const flashcards = JSON.parse(rawJson);
        return NextResponse.json(flashcards);

    } catch (error) {
        console.error("Error extracting flashcards:", error);
        return NextResponse.json({ error: "Failed to extract flashcards", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
