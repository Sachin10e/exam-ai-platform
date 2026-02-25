import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  const { unitName } = await req.json()

  const { data: docs } = await supabase
    .from('documents')
    .select('full_text')

  const combinedText = docs?.map(d => d.full_text).join('\n') || ''

  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3:8b-instruct-q4_K_M',
      prompt: `
You are an exam expert.

Based on the following syllabus content, generate:

1. Important topics
2. Expected 5-mark questions
3. Expected 10-mark questions
4. Short revision summary

Unit: ${unitName}

Content:
${combinedText}

Keep it structured and exam-focused.
`,
      stream: false,
      options: {
        temperature: 0.2,
        num_predict: 400
      }
    })
  })

  const data = await res.json()

  return NextResponse.json({ result: data.response })
}
