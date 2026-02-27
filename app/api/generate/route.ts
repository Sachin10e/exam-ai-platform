import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getUserSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  )
}

export async function POST(req: Request) {
  try {
    const { unit, question, marks, subjectId } = await req.json()
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') || ''

    const hasUnitFlow = !!unit
    const hasQuestionFlow = !!question && !!marks

    if (!hasUnitFlow && !hasQuestionFlow) {
      return NextResponse.json(
        { error: 'Provide either "unit" or "question" and "marks"' },
        { status: 400 }
      )
    }

    // Fetch subject: prefer explicit subjectId, then latest for current user, then latest global
    let subjectRows
    let subjectError

    if (subjectId) {
      const { data, error } = await serviceSupabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .limit(1)
      subjectRows = data
      subjectError = error
    }

    if ((!subjectRows || subjectRows.length === 0) && token) {
      const userSupabase = getUserSupabase(token)

      const {
        data: { user },
      } = await userSupabase.auth.getUser()

      if (user) {
        const { data, error } = await userSupabase
          .from('subjects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        subjectRows = data
        subjectError = error
      }
    }

    if (!subjectRows || subjectRows.length === 0) {
      const { data, error } = await serviceSupabase
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

    // Caching for unit flow
    if (hasUnitFlow && unit) {
      const { data: existingPrep } = await serviceSupabase
        .from('preps')
        .select('content')
        .eq('subject_id', subject.id)
        .eq('unit', unit)
        .single()

      if (existingPrep?.content) {
        return NextResponse.json({ prep: existingPrep.content, cached: true })
      }
    }

    // Fetch chunks using True RAG
    let contextText = ''
    try {
      const { generateEmbedding } = await import('../../../lib/ollama')
      const queryText = hasUnitFlow ? `comprehensive details and summary for ${unit}` : question
      const queryEmbedding = await generateEmbedding(queryText)

      const { data: chunks, error: matchError } = await serviceSupabase.rpc('match_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.2, // Adjust threshold if needed
        match_count: 10,
        filter_subject_id: subject.id
      })

      if (chunks && chunks.length > 0) {
        contextText = chunks.map((c: any) => c.content).join('\n\n')
      }
    } catch (e) {
      console.error('Vector search failed, falling back', e)
    }

    // Fallback if RAG fails
    if (!contextText) {
      const { data: chunks, error: chunksError } = await serviceSupabase
        .from('chunks')
        .select('content')
        .eq('subject_id', subject.id)
        .limit(15)

      if (chunksError || !chunks || chunks.length === 0) {
        return NextResponse.json(
          { error: 'No syllabus content available' },
          { status: 404 }
        )
      }
      contextText = chunks.map((c: any) => c.content).join('\n\n')
    }

    // Build prompt depending on flow
    let prompt: string

    if (hasUnitFlow) {
      // Strict academic prompt for unit preparation
      prompt = `
You are an academic assistant specializing in exam preparation for university students.

STRICT INSTRUCTIONS:
- Use ONLY the information from the provided syllabus context. Do NOT use general knowledge or add content not found in the context.
- If information for a section is missing, clearly write: "Not found in uploaded material."
- Answer should be detailed, focused, and avoid generic AI phrases, fluff, or hallucinations. 
- NO generalized, off-topic, or vague content.

Prepare a comprehensive unit summary for the following UNIT: "${unit}".

SYLLABUS CONTEXT:
${contextText}

Provide the following, each section in clear headings:

1. Unit Overview
2. Key Concepts
3. Expected 5-Mark Questions (with short academic sample question titles)
4. Expected 10-Mark Questions (with short academic sample question titles)
5. Important Topics
6. Quick Revision Points

Keep each section directly tied to the context. If a section cannot be completed from context, state "Not found in uploaded material" for that section.
`
    } else {
      // Prompt for answering a specific exam-style question with marks
      prompt = `
You are an academic assistant specializing in exam preparation for university students.

STRICT INSTRUCTIONS:
- Use ONLY the information from the provided syllabus context. Do NOT use general knowledge or add content not found in the context.
- If information for part of the answer is missing, clearly write: "Not found in uploaded material."
- Answer should be detailed, focused, and avoid generic AI phrases, fluff, or hallucinations. 
- NO generalized, off-topic, or vague content.

SYLLABUS CONTEXT:
${contextText}

EXAM QUESTION (worth ${marks} marks):
"${question}"

Write a high-quality answer appropriate for an exam worth ${marks} marks.
- Structure the answer clearly.
- Focus only on content supported by the context.
`
    }

    // Call Ollama
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    const llmRes = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3:8b-instruct-q4_K_M',
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 1000,
        },
      }),
    })

    if (!llmRes.ok) {
      return NextResponse.json(
        { error: 'LLM request failed' },
        { status: 500 }
      )
    }

    const llmData = await llmRes.json()

    // Best-effort save for unit prep history (non-blocking)
    if (hasUnitFlow && llmData?.response) {
      try {
        await serviceSupabase.from('preps').insert({
          subject_id: subject.id,
          unit,
          content: llmData.response,
        })
      } catch {
        // Ignore failures so generation still succeeds
      }
    }

    // Return shape depends on flow, keeping frontend stable
    if (hasUnitFlow) {
      return NextResponse.json({ prep: llmData.response })
    }

    return NextResponse.json({ answer: llmData.response })

  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Minimal exam preparation handler.
// Use PUT /api/generate with body: { examType: "mid" | "semester" }
export async function PUT(req: Request) {
  try {
    const { examType } = await req.json()

    if (examType !== 'mid' && examType !== 'semester') {
      return NextResponse.json(
        { error: 'Invalid examType. Must be "mid" or "semester".' },
        { status: 400 }
      )
    }

    // 1) Fetch latest subject
    const { data: subjectRows, error: subjectError } = await serviceSupabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

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
      const { data: chunks, error: matchError } = await serviceSupabase.rpc('match_chunks', {
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

    // 3) Fallback
    if (!contextText) {
      const { data: chunks, error: chunksError } = await serviceSupabase
        .from('chunks')
        .select('content')
        .eq('subject_id', subject.id)
        .limit(15)

      if (chunksError || !chunks || chunks.length === 0) {
        return NextResponse.json(
          { error: 'No syllabus content available for exam preparation' },
          { status: 404 }
        )
      }
      contextText = chunks.map((c: any) => c.content).join('\n\n')
    }

    // 5) Build academic exam-paper prompt based on examType
    const base = `
You are an academic exam paper generator for university-level courses.

RULES:
- Prefer the provided syllabus context for all questions and answers.
- If the context is insufficient, you MAY use academically correct general knowledge.
- Do NOT use generic AI filler phrases (e.g., "As an AI model", "I hope this helps").
- Output must be structured only (headings, numbering) with no extra commentary.

SYLLABUS CONTEXT:
${contextText}
`.trim()

    let prompt: string

    if (examType === 'mid') {
      prompt = `
${base}

Now generate a MID-SEMESTER exam paper with the following exact structure:

SECTION A (Descriptive – 20 Marks)
- Q1: 5 Marks
- Q2: 5 Marks
- Q3: 10 Marks

For each question in Section A:
- Provide a clear, exam-style question.
- Immediately follow it with a concise model answer.

SECTION B (MCQs – 10 Questions)
- 10 multiple-choice questions.
- Each MCQ must have exactly 4 options labelled A), B), C), D).

After listing all MCQs, provide an "ANSWER KEY" section that lists the correct option for each question (e.g., "1) C").

Output format example (follow this structure, but fill with real academic content):

SECTION A (Descriptive – 20 Marks)
Q1 (5 Marks): <question text>
Answer: <answer text>

Q2 (5 Marks): <question text>
Answer: <answer text>

Q3 (10 Marks): <question text>
Answer: <answer text>

SECTION B (MCQs – 10 Questions)
1. <question text>
   A) ...
   B) ...
   C) ...
   D) ...
2. <question text>
   A) ...
   B) ...
   C) ...
   D) ...
...

ANSWER KEY
1) <option letter>
2) <option letter>
...
`.trim()
    } else {
      // examType === 'semester'
      prompt = `
${base}

Now generate a SEMESTER exam paper with the following structure:

UNIT-WISE LONG QUESTIONS
- Detect or infer units from the syllabus context (e.g., "Unit 1", "Unit 2", etc.).
- For EACH unit:
  - Generate either ONE 10-mark question with its model answer
    OR TWO 5-mark questions each with their model answers.
- Clearly label the unit and the marks for each question.

SHORT ANSWERS
- Generate 10 one-mark questions that cover key definitions, concepts, or facts.
- Immediately provide a short, precise answer for each 1-mark question.

Output format example (follow this structure, but fill with real academic content):

UNIT-WISE LONG QUESTIONS
Unit 1: <Unit title or topic>
Q1 (10 Marks): <question text>
Answer: <answer text>

Unit 2: <Unit title or topic>
Q1 (5 Marks): <question text>
Answer: <answer text>
Q2 (5 Marks): <question text>
Answer: <answer text>
...

SHORT ANSWERS (1 Mark Each)
1) <question> — <answer>
2) <question> — <answer>
...
10) <question> — <answer>
`.trim()
    }

    // 6) Call Ollama
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    const llmRes = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3:8b-instruct-q4_K_M',
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 800,
        },
      }),
    })

    if (!llmRes.ok) {
      return NextResponse.json(
        { error: 'LLM request failed' },
        { status: 500 }
      )
    }

    const llmData = await llmRes.json()

    // 7) Return minimal exam preparation text
    return NextResponse.json({
      examPrep: llmData.response || '',
    })
  } catch (err) {
    console.error('Exam preparation error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

