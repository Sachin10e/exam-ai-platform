import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { question, marks } = await req.json()

    if (!question) {
      return NextResponse.json({ error: 'Question required' }, { status: 400 })
    }

    // 1️⃣ Generate embedding for query
    const embedRes = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: question,
      }),
    })

    const embedData = await embedRes.json()
    const embedding = embedData.embedding

    // 2️⃣ Retrieve more chunks (stronger grounding)
    const { data: chunks, error } = await supabase.rpc('match_chunks', {
      query_embedding: embedding,
      match_count: 8,
    })

    if (error || !chunks || chunks.length === 0) {
      return NextResponse.json({ error: 'No relevant syllabus content found' })
    }

    const contextText = chunks.map((c: any) => c.content).join('\n\n')

    // 3️⃣ Structured exam-focused prompt
    const prompt = `
You are an academic exam preparation assistant.

Your goal:
- Produce a high-scoring university exam answer.
- Expand concepts clearly.
- Stay aligned to the syllabus topic.
- No unnecessary fluff.
- No unrelated examples.
- No generic machine learning content unless present in syllabus.

Marks: ${marks}

Syllabus Context:
${contextText}

Question:
${question}

Answer format:

1. Definition
2. Concept Explanation
3. Working / Steps / Construction
4. Key Points
5. Conclusion

Depth rule:
- 5 marks → concise but complete (400–500 words)
- 10 marks → detailed and exam-ready (600–900 words)
`

    // 4️⃣ Call Ollama
    const llmRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3:8b-instruct-q4_K_M',
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: marks >= 10 ? 900 : 600,
        },
      }),
    })

    const llmData = await llmRes.json()

    return NextResponse.json({ answer: llmData.response })

  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
