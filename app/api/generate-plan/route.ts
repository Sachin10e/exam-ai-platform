import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

export async function POST(req: Request) {
    try {
        const { subjectId, urgency, examType, answerLength, targetGrade = 'Top', explanationStyle = 'Academic' } = await req.json()

        if (!subjectId) {
            return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
        }

        // Fetch all contextual chunks for this subject (Since this is a study plan, we want a broad context, limited to top 30 chunks)
        // A real system might summarize the syllabus first, but for now we concatenate.
        const { data: chunks, error: chunkListErr } = await serviceSupabase
            .from('chunks')
            .select('content')
            .eq('subject_id', subjectId)
            .limit(40)

        let contextText = ''
        if (chunks && chunks.length > 0) {
            contextText = chunks.map(c => c.content).join('\n\n')
        }

        // Prompt Engineering Parameters
        const isCramming = urgency === 'Cram'
        const lengthDirective = answerLength === 'Long'
            ? 'Generate VERY detailed, 10-mark essay length answers with complex multi-level structures, headings, and detailed examples.'
            : 'Generate SHORT, punchy, crisp, 2-mark to 5-mark bullet points.'

        const gradeDirective = targetGrade === 'Pass'
            ? 'Focus purely on the absolute minimum core concepts required to just pass the exam.'
            : 'Provide top-tier, exhaustive details aimed at scoring 100% in the exam.'

        const styleDirective = explanationStyle === 'Simplified'
            ? 'Use extreme "Explain Like I am 5" (ELI5) analogies, simple language, and avoid dense jargon where possible.'
            : 'Use strictly formal academic language, industry-standard jargon, and highly rigorous technical definitions.'

        const prompt = `
Act as an elite University Examiner and Master Tutor.
You are tasked with generating a high-yield, extremely rigorous Exam Study Plan based on the provided parameter rules and context.

USER EXAM PARAMETERS:
- Exam Proximity: ${isCramming ? 'URGENT (Exam is Tomorrow). Prioritize the most frequently tested concepts and simplify explanations for rapid memorization. Skip fluff.' : 'Deep Study. Provide comprehensive, deeply technical, and nuance-heavy explanations.'}
- Target Grade: ${gradeDirective}
- Explanation Style: ${styleDirective}
- Desired Answer Detail: ${lengthDirective}

SYLLABUS & DOCUMENT CONTEXT:
${contextText.substring(0, 15000)}

YOUR MISSION:
Analyze the context. You must generate an EXACT JSON object matching the schema below. No markdown wrappers, no introductory text.

REQUIREMENTS FOR QUALITY AND DYNAMIC FORMATTING:
1. DYNAMIC ANATOMY: The formatting of each Hitlist Answer MUST adapt to the specific question being asked:
   - If the question is about "Differences", "Comparisons", or "Vs", you MUST use a Markdown Table.
   - If the question is Mathematical, analytical, or algorithmic, you MUST use step-by-step numbered logic and LaTeX-style code blocks for formulas.
   - If the question is Architecture, Frameworks, or Processes, use bulleted lists with bold headings.
2. Bold key terms and facts for grading visibility.
3. Every Hitlist Answer MUST end with a short "💡 Pro-Tip:" or "🧠 Mnemonic:" to make it extremely easy to remember on exam day.

SCHEMA TO MATCH:
{
  "hitlist": [
    { "q": "Question Text [10 Marks]", "a": "Highly professional, dynamically structured answer containing tables/formulas if needed based on the question taxonomy.\\n\\n💡 Pro-Tip: [Easy memory trick]" }
  ],
  "summaries": [
    { "unit": "Unit Name", "text": "Rapid review paragraph." }
  ],
  "flashcards": [
    { "front": "Term", "back": "1 sentence definition." }
  ]
}

CONSTRAINT: 
Generate EXACTLY 4 high-yield hitlist questions, 2 unit summaries, and 5 flashcards. Do NOT exceed this quota; we need maximum speed. Ensure JSON is strictly valid.
`

        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3:8b-instruct-q4_K_M',
                prompt: prompt,
                stream: false,
                format: 'json',
                options: {
                    temperature: 0.15,
                    num_predict: 3000 // Reduced from 4000 to improve Time-To-First-Byte
                }
            })
        })

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`)
        }

        const data = await response.json()
        const rawJsonString = data.response

        // Parse the generated JSON
        let parsedPlan
        try {
            parsedPlan = JSON.parse(rawJsonString)
        } catch (e) {
            console.error("Failed to parse Ollama JSON:", rawJsonString)
            return NextResponse.json({ error: 'AI generated invalid JSON structure.' }, { status: 500 })
        }

        return NextResponse.json(parsedPlan)

    } catch (error: any) {
        console.error('Generate Plan Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
