import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '../../../lib/ollama'

const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

export async function POST(req: Request) {
    try {
        const { messages, subjectId } = await req.json()

        // Get the latest user message
        const lastMessage = messages[messages.length - 1]
        const query = lastMessage.content

        let contextText = ''

        // Attempt True RAG if we have a subjectId
        if (subjectId) {
            try {
                const queryEmbedding = await generateEmbedding(query)
                const { data: chunks, error } = await serviceSupabase.rpc('match_chunks', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.15,
                    match_count: 10,
                    filter_subject_id: subjectId
                })

                if (chunks && chunks.length > 0) {
                    contextText = chunks.map((c: any) => c.content).join('\n\n')
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

UPLOADED KNOWLEDGE BASE CONTEXT:
${contextText ? contextText : 'No document context found for this query.'}
`.trim()

        // Format messages for Ollama API
        const ollamaMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ]

        // Fetch from Ollama stream endpoint
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3:8b-instruct-q4_K_M',
                messages: ollamaMessages,
                stream: true,
                options: {
                    temperature: 0.3,
                    num_predict: 2000,
                    repeat_penalty: 1.15
                }
            })
        })

        if (!response.ok || !response.body) {
            return NextResponse.json({ error: 'LLM failed' }, { status: 500 })
        }

        let buffer = ''
        const decoder = new TextDecoder('utf-8')

        const transformStream = new TransformStream({
            transform(chunk, controller) {
                const text = decoder.decode(chunk, { stream: true })
                buffer += text

                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (!line.trim()) continue

                    try {
                        const parsed = JSON.parse(line)
                        if (parsed.message?.content) {
                            // Convert text into Uint8Array chunks directly for the Web API Response
                            controller.enqueue(new TextEncoder().encode(parsed.message.content))
                        }
                    } catch (e) {
                        // ignore broken json line
                    }
                }
            },
            flush(controller) {
                if (buffer.trim()) {
                    try {
                        const parsed = JSON.parse(buffer)
                        if (parsed.message?.content) {
                            controller.enqueue(new TextEncoder().encode(parsed.message.content))
                        }
                    } catch (e) { }
                }
            }
        })

        // Stream NDJSON payload out
        const textStream = response.body.pipeThrough(transformStream)

        return new Response(textStream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
            }
        })

    } catch (error: any) {
        console.error('Chat API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
