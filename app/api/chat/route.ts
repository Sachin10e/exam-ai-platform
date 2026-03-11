import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AIResponse } from '../../types';
import { generateEmbedding } from '../../../lib/embeddings'
import { GoogleGenerativeAI } from '@google/generative-ai'

const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)



export async function POST(req: Request) {
    try {
        const body = await req.json()
        const subjectId = body.subjectId

        let messages = body.messages

        if (!messages && body.message) {
            messages = [{ role: 'user', content: body.message }]
        }

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Valid "messages" array or "message" string is required' }, { status: 400 })
        }

        // Get the latest user message
        const lastMessage = messages[messages.length - 1]
        const query = lastMessage.content

        let contextText = ''

        // Attempt True RAG if we have a subjectId
        if (subjectId) {
            try {
                const queryEmbedding = await generateEmbedding(query)
                const { data: chunks } = await serviceSupabase.rpc('match_chunks', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.15,
                    match_count: 10,
                    filter_subject_id: subjectId
                })

                if (chunks && chunks.length > 0) {
                    contextText = chunks.map((c: { content: string }) => c.content).join('\n\n')
                }
            } catch (err) {
                console.error('RAG Error:', err)
            }
        }

        // Prepare system prompt based on user requests
        const systemPrompt = `
You are an expert academic tutor and exam preparation assistant.
Your absolute priority is to help the user prepare for their university exams effectively.

STRICT RULES:
1. LONG ANSWERS: If the user asks for theory explanations, unit summaries, or 10-mark questions, generate VERY LONG, IN-DEPTH, and DETAILED answers. A 10-mark question MUST be at least 400-600 words long with headings and bullet points.
2. SYLLABUS PRIORITY: If a Syllabus or PYQ (Previous Year Questions) context is provided below, you MUST cross-reference them to prioritize the most frequently mentioned or heavily weighted topics first. Tell the student what is "most expected".
3. EXPECTED QUESTIONS: When asked for expected questions, provide exactly the requested number of questions (both theory and MCQs) tailored to the provided context.
4. UNIT-WISE STUDY: If a syllabus is uploaded, break down preparation strictly "Unit-wise", prioritizing the highest-yield units.
5. FALLBACK: If the provided text context does NOT contain the exact answer, you MUST use your own general academically-correct knowledge to answer the question, but add a brief note: "*(Note: This was answered using general knowledge as it wasn't explicitly found in your uploaded documents)*".
6. Conversational but highly academic tone.
7. FORMATTING - COMPARISONS: If the user's question contains words like "difference", "compare", or "vs", you MUST output your answer as a Markdown comparison table.
8. FORMATTING - PROCESSES: If the user's question describes "steps", "workflow", or "process", you MUST generate a Mermaid flowchart. 
   CRITICAL MERMAID RULES: 
   1. You MUST wrap all node labels in double quotes to prevent syntax errors. 
   2. You MUST NOT use any text on connection edges/arrows. (e.g., A-->B is valid. A-->|text|B is INVALID).
   Example:
\`\`\`mermaid
flowchart TD
A["Start (Initial)"] --> B["Step 1"]
B --> C["Step 2"]
C --> D["End"]
\`\`\`

UPLOADED KNOWLEDGE BASE CONTEXT:
${contextText ? contextText : 'No document context found for this query.'}
`.trim()

        // Collapse the entire conversational history into a single monolithic user prompt 
        // to completely bypass Gemini's strict "User must start" and "Alternating turns only" rules.
        const historyText = messages.map((m: AIResponse) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n---NEXT MESSAGE---\n\n')

        const geminiMessages = [
            {
                role: 'user',
                parts: [{ text: `Here is the conversation history, followed by my new request. Do NOT duplicate any questions you have already generated in the ASSISTANT blocks.\n\n${historyText}` }]
            }
        ]

        // Add System instruction manually to the first message or use SystemInstruction field
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-lite-latest",
            systemInstruction: systemPrompt,
            generationConfig: {
                temperature: 0.3,
            }
        })

        const result = await model.generateContentStream({ contents: geminiMessages })

        const textEncoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text()
                        if (chunkText) {
                            controller.enqueue(textEncoder.encode(chunkText))
                        }
                    }
                    controller.close()
                } catch (err) {
                    controller.error(err)
                }
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
            }
        })

    } catch (error: unknown) {
        console.error('Chat API Error:', error)
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
    }
}
