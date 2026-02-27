import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ExamType = 'mid' | 'semester'

async function fetchAllChunks(subjectId: string) {
  const all: { content: string }[] = []
  const pageSize = 1000
  let from = 0

  // Pull all rows using range pagination
  while (true) {
    const { data, error } = await supabase
      .from('chunks')
      .select('content')
      .eq('subject_id', subjectId)
      .range(from, from + pageSize - 1)

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break

    all.push(...data)
    if (data.length < pageSize) break

    from += pageSize
  }

  return all
}

function buildPrompt(examType: ExamType, contextText: string) {
  const common = `
You are an academic exam-preparation assistant for university students.

STRICT RULES:
- Use the provided syllabus context as the primary source.
- If the context is insufficient for a question/answer, you MAY use academically correct general knowledge to fill gaps.
- Do NOT use generic AI phrases (e.g., "As an AI...", "I hope this helps...").
- Keep formatting structured with clear headings and numbering.
- Keep language formal and exam-oriented.

SYLLABUS CONTEXT:
${contextText?.trim() ? contextText : '(No syllabus context available)'}
`.trim()

  if (examType === 'mid') {
    return `
${common}

Generate a MID-SEMESTER exam preparation set with the following structure:

## Section A
- 2 questions of 5 marks each, with high-quality model answers.
- 1 question of 10 marks, with a high-quality model answer.

## Section B
- 10 MCQs. Each MCQ must have exactly 4 options (A, B, C, D).
- Provide an answer key for all MCQs.

Output format must be:

### Mid-Semester Exam Preparation
#### Section A
Q1 (5 marks): <question>
Answer: <answer>
Q2 (5 marks): <question>
Answer: <answer>
Q3 (10 marks): <question>
Answer: <answer>

#### Section B (MCQs)
1. <question>
   A) ...
   B) ...
   C) ...
   D) ...
...

#### Answer Key
1) A
2) C
...
`.trim()
  }

  return `
${common}

Generate a SEMESTER exam preparation set with the following structure:

## Part 1: Unit-wise long answers
- Identify units from the syllabus context (use unit headings if present; otherwise infer reasonable units based on the topics available).
- For EACH unit, generate 1 long-answer question (choose 5 or 10 marks appropriately) with a high-quality model answer.

## Part 2: Short answers
- Generate 10 short 1-mark questions with crisp answers.

Output format must be:

### Semester Exam Preparation
#### Unit-wise Long Answers
Unit 1: <unit title>
Q1 (<5 or 10> marks): <question>
Answer: <answer>

Unit 2: <unit title>
Q2 (<5 or 10> marks): <question>
Answer: <answer>
...

#### 1-Mark Short Answers
1) <question> — <answer>
2) <question> — <answer>
...
`.trim()
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const examType = body?.examType as ExamType | undefined
    const subjectId = body?.subjectId as string | undefined

    if (examType !== 'mid' && examType !== 'semester') {
      return NextResponse.json(
        { error: 'Invalid examType. Must be "mid" or "semester".' },
        { status: 400 }
      )
    }

    // 1) Fetch subject: prefer explicit subjectId, otherwise latest
    let subjectRows
    let subjectError

    if (subjectId) {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .limit(1)
      subjectRows = data
      subjectError = error
    }

    if (!subjectRows || subjectRows.length === 0) {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

      subjectRows = data
      subjectError = error
    }

    if (subjectError || !subjectRows || subjectRows.length === 0) {
      return NextResponse.json(
        { error: 'Could not fetch latest subject' },
        { status: 500 }
      )
    }

    const subject = subjectRows[0]

    // 2) Retrieve context chunks using RAG
    let contextText = ''
    try {
      const { generateEmbedding } = await import('../../../lib/ollama')
      const queryText = examType === 'mid'
        ? 'important concepts and questions for mid semester examination'
        : 'comprehensive overview of all units and most important topics for final semester examination';

      const queryEmbedding = await generateEmbedding(queryText)
      const { data: chunks, error: matchError } = await supabase.rpc('match_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.2,
        match_count: 15,
        filter_subject_id: subject.id
      })

      if (chunks && chunks.length > 0) {
        contextText = chunks.map((c: any) => c.content).join('\n\n')
      }
    } catch (e) {
      console.error('Vector search failed, falling back', e)
    }

    if (!contextText) {
      const chunks = await fetchAllChunks(subject.id)
      contextText = chunks.slice(0, 15).map((c) => c.content).join('\n\n')
    }

    // 3) Build strict academic prompt
    const prompt = buildPrompt(examType, contextText)

    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    const llmRes = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3:8b-instruct-q4_K_M',
        prompt,
        stream: true,
        options: {
          temperature: 0.3,
          num_predict: 1200,
        },
      }),
    })

    if (!llmRes.ok || !llmRes.body) {
      return NextResponse.json({ error: 'LLM request failed' }, { status: 500 })
    }

    // Set up a TransformStream to process Ollama's ndjson into raw text chunks
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk)
        const lines = text.split('\n').filter(Boolean)

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line)
            if (parsed.response) {
              controller.enqueue(new TextEncoder().encode(parsed.response))
            }
          } catch (e) {
            // ignore parse errors for partial chunks
          }
        }
      }
    })

    return new NextResponse(llmRes.body.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err) {
    console.error('Exam prep server error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

