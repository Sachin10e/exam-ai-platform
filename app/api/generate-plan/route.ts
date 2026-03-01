import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { GoogleGenerativeAI } from '@google/generative-ai'
const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

export async function POST(req: Request) {
    try {
        const { subjectId, urgency, examType, answerLength, targetGrade = 'Top', explanationStyle = 'Academic', targetUnit = 1 } = await req.json()

        if (!subjectId) {
            return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
        }

        // Fetch all contextual chunks for this subject (Since Gemini 2.x has a massive context window, we can fetch up to 150 chunks to give it the entire syllabus)
        const { data: chunks, error: chunkListErr } = await serviceSupabase
            .from('chunks')
            .select('content')
            .eq('subject_id', subjectId)
            .limit(150)

        let contextText = ''
        if (chunks && chunks.length > 0) {
            contextText = chunks.map(c => c.content).join('\n\n')
        }

        // Prompt Engineering Parameters
        const isCramming = urgency === 'Cram'
        const lengthDirective = answerLength === 'Long'
            ? 'Generate VERY detailed, 10-mark essay length answers with complex multi-level structures, headings, and detailed examples.'
            : 'Generate concisely formatted 2-5 mark answers. Enforce exactly 1 to 3 sentences MAXIMUM. Keep it extremely brief, punchy, and highly readable to save time.'

        const gradeDirective = targetGrade === 'Pass'
            ? 'Focus purely on the absolute minimum core concepts required to just pass the exam.'
            : 'Provide top-tier, exhaustive details aimed at scoring 100% in the exam.'

        const styleDirective = explanationStyle === 'Simplified'
            ? 'Use highly accessible, simple language, and avoid dense jargon where possible. Break every single paragraph down into highly readable bullet points. Do NOT use childish ELI5 analogies.'
            : 'Use strictly formal academic language, industry-standard jargon, and highly rigorous technical definitions. Structure answers with pristine layout: heavy use of bold terms, structured lists, and blank lines between thoughts.'

        const prompt = `
Act as an elite University Examiner and Master Tutor.
You are tasked with generating a high-yield, extremely rigorous Exam Study Plan smoothly and continuously.

USER EXAM PARAMETERS:
- Exam Proximity: ${isCramming ? 'URGENT (Exam is Tomorrow). Prioritize the most frequently tested concepts and simplify explanations for rapid memorization. Skip fluff.' : 'Deep Study. Provide comprehensive, deeply technical, and nuance-heavy explanations.'}
- Target Grade: ${gradeDirective}
- Explanation Style: ${styleDirective}
- Desired Answer Detail: ${lengthDirective}
- Target Unit to Generate: UNIT ${targetUnit}

SYLLABUS & DOCUMENT CONTEXT:
${contextText || '🚨 WARNING: NO TEXT CONTEXT WAS FOUND IN THE UPLOADED DOCUMENT.'}

YOUR MISSION:
Analyze the syllabus context deeply. YOU MUST NOT USE GENERAL INTERNET KNOWLEDGE. YOU MUST NOT GUESS.
Every single expected question you generate MUST BE ROOTED EXACTLY in the provided Syllabus Text below.
If the syllabus is about "Compiler Design", do NOT generate questions about "General Research".
If the provided context is empty or entirely irrelevant, output EXACTLY this string and nothing else:
"🚨 **SYSTEM HALT: Insufficient Syllabus Data.** Upload a valid syllabus or document to generate a survival plan."

YOUR PROGRESSIVE GENERATION DIRECTIVE:
Instead of summarizing the whole syllabus, you MUST focus entirely and exclusively on **UNIT ${targetUnit}** from the provided context. If the syllabus does not explicitly label units with numbers, identify the ${targetUnit}-th logical broad topic/chapter as the target unit.
For Unit ${targetUnit}, you must completely EXHAUST all important topics to ensure the student misses nothing. 
For Unit ${targetUnit}, you MUST generate three distinct sections:
1. LONG EXPECTED QUESTIONS (Detailed answers)
2. EXPECTED SHORT QUESTIONS (1 or 2 mark answers)
3. EXPECTED MCQs (Multiple Choice Questions with the correct answer explicitly marked)

OUTPUT FORMAT (STRICT):
You MUST output PURE VALID MARKDOWN ONLY. No introductory conversational filler.
YOU MUST USE THE '#' SYMBOL FOR HEADINGS. NEVER output headings as plain text.

REQUIREMENTS FOR QUALITY AND DYNAMIC FORMATTING:
1. UNIT ISOLATION: You MUST only generate content for Unit ${targetUnit}. Do NOT generate anything for Unit ${targetUnit + 1} or any other unit.
2. DISTINCT SECTIONS: separate Long Questions, Short Questions, and MCQs visually with headers.
3. DYNAMIC ANATOMY: 
   - EVERY Question MUST be distinctly separated by a horizontal rule \`---\`.
   - EVERY Long Question MUST start with a large, bold H3 Markdown header strictly using the \`### \` syntax (e.g., \`### Question 1: What is the difference between... [${answerLength === 'Long' ? '10' : '5'} Marks]\`).
   - If a long question asks for "Differences", "Comparisons", or "Vs", you MUST output a STRICT Markdown Table. Your table MUST include the divider row (e.g., \`| Feature | A | B |\` followed exactly by \`|---|---|---|\`). DO NOT skip the divider row.
   - You MUST use rich formatting to explain concepts clearly: Use ASCII flowcharts, code blocks, step-by-step logic, bold keywords, and bulleted lists.
4. SEPARATE RESOURCES AND TIPS on new lines (FOR LONG QUESTIONS ONLY):
   - Every major Answer MUST end with a short "💡 Pro-Tip:" or "🧠 Mnemonic:" on its own distinct line.
   - On a NEW LINE, append a Web Reference Link: \`[🌍 Search Web for {Exact Topic}](https://www.google.com/search?q={URL_ENCODED_TOPIC})\`
   - On a NEW LINE, append a YouTube Link: \`[📺 Watch YouTube Tutorial](https://www.youtube.com/results?search_query={URL_ENCODED_TOPIC})\`
   - DO NOT append "Explain like I'm 5" to the queries. Keep them perfectly academic and exact.
5. TYPOGRAPHY RESTRICTIONS (STRICT):
   - CRITICAL QUESTION SIZING: For EVERY SINGLE QUESTION across ALL 3 Sections, you MUST start the line with exactly '#### ' (Markdown Header 4) to ensure uniform font size. Examples: '#### Question 1: ', '#### Q1: ', '#### MCQ 1: '.
   - CRITICAL ANSWER SIZING (SECTION 2): You MUST NOT use ANY Markdown headers ('#', '##', '###', '####') for the answers in Section 2. You MUST NOT use ANY asterisks ('**'). Prefix the answer text strictly with 'A: ' rather than 'Answer:'. It MUST be exactly: 'A: [Plain normal weight text]'.
   - MULTIPLE CHOICE FORMAT: Place the ✅ tick mark INLINE next to the correct option string. DO NOT make a separate "Correct Answer" line.

CRITICAL - USE THIS EXACT MARKDOWN TEMPLATE AS YOUR FRAMEWORK:
## 📘 Unit ${targetUnit} Exhaustive Plan

### SECTION 1: LONG EXPECTED QUESTIONS
#### Question 1: [Insert Question Here] [${answerLength === 'Long' ? '10' : '5'} Marks]

**Answer:**
[Insert Paragraphs or Bullet Points with easy, understandable examples]

| Feature | Point A | Point B |
|---|---|---|
| Example | Data | Data |

[Optional ASCII Flowcharts/Diagrams if applicable]

💡 Pro-Tip: [Insert tip]

[🌍 Search Web for Concept](URL)

[📺 Watch YouTube Tutorial](URL)

---
#### Question 2: [Insert Question Here] [${answerLength === 'Long' ? '10' : '5'} Marks]
... (Continue for all long expected questions in Unit ${targetUnit})

### SECTION 2: EXPECTED SHORT QUESTIONS (1-2 Marks)
#### Q1: [Insert Short Question Here]
A: [Insert completely plain text explanation here without bolding]
---
#### Q2: [Insert Short Question Here]
... (Continue for all highly probable short questions)

### SECTION 3: EXPECTED MCQs
#### MCQ 1: [Insert Question Here]
- A) [Option A]
- B) [Option B] ✅
- C) [Option C]
- D) [Option D]
---
#### MCQ 2: [Insert Question Here]
... (Continue for all highly probable MCQs)
`

        // 4. GENERATE WITH GEMINI
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!) // Added '!' for non-null assertion
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8000,
            }
        })

        const result = await model.generateContentStream(prompt)

        // 5. STREAM TO FRONTEND
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
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        })

    } catch (error: any) {
        console.error('Generate Plan Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
