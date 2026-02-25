import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST() {
  const { data: docs } = await supabase
    .from('documents')
    .select('full_text')

  const combined = docs?.map(d => d.full_text).join('\n') || ''

  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3:8b-instruct-q4_K_M',
      prompt: `
You are an exam prediction assistant.

Based on the following syllabus/material,
generate:

1. 5 expected 5-mark questions
2. 3 expected 10-mark questions
3. 5 short 2-mark questions

Keep it exam-focused and realistic.

Content:
${combined}
`,
      stream: false,
      options: {
        temperature: 0.2,
        num_predict: 300
      }
    })
  })

  const data = await res.json()

  return NextResponse.json({ questions: data.response })
}
