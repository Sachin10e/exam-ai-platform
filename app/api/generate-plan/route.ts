export const maxDuration = 300;
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateEmbedding } from '../../../lib/embeddings'
const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
)



export async function POST(req: Request) {
    try {
        const { subjectId, urgency, examType, midType, answerLength, targetGrade = 'Top', explanationStyle = 'Academic', targetUnit = 1, guestContextText } = await req.json()

        if (!subjectId && !guestContextText) {
            return NextResponse.json({ error: 'Subject ID or local context is required' }, { status: 400 })
        }

        let contextText = ''
        
        if (guestContextText) {
            // GUEST MODE BYPASS: Do not query RAG. Feed raw string buffer.
            contextText = guestContextText;
        } else {
            const query = `Unit ${targetUnit} important topics and expected questions for ${examType} exam`
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

        // --- CONSTRUCT THE SYSTEM PROMPT ---
        let boundInstructions = '';
        if (examType === 'Mid') {
            if (midType === 'Mid 1') {
                boundInstructions = 'CRITICAL REQUIREMENT: The user is only studying for "Mid 1". You MUST ONLY draw questions and contextual bounds from Unit 1 up to the exact halfway point of Unit 3. DO NOT include late Unit 3, Unit 4, or Unit 5 material.';
            } else if (midType === 'Mid 2') {
                boundInstructions = 'CRITICAL REQUIREMENT: The user is only studying for "Mid 2". You MUST ONLY draw questions and contextual bounds from the second half of Unit 3 through Unit 5. IGNORE Unit 1 and Unit 2 completely.';
            }
        }

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
${boundInstructions}
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
   - EVERY Question MUST be distinctly separated by a horizontal rule \`---\`. You MUST leave a blank empty line before and after the rule.
   - EVERY Long Question MUST start with a large, bold H3 Markdown header strictly using the \`### \` syntax (e.g., \`### Question 1: What is the difference between... [${answerLength === 'Long' ? '10' : '5'} Marks]\`).
   - FORMATTING - COMPARISONS: If a question asks for or contains words like "difference", "compare", or "vs", you MUST output your answer as a STRICT Markdown comparison table. Your table MUST include the divider row (e.g., \`| Feature | A | B |\` followed exactly by \`|---|---|---|\`). DO NOT skip the divider row.
   - FORMATTING - PROCESSES: If a question describes "steps", "workflow", or "process", you MUST generate a Mermaid flowchart. 
     CRITICAL MERMAID RULES: 
     1. You MUST wrap all node labels in double quotes to prevent syntax errors if they contain spaces or parentheses. 
     2. You MUST NOT use any text on connection edges/arrows. (e.g., A-->B is valid. A-->|text|B is INVALID and will crash).
     Example:
\`\`\`mermaid
flowchart TD
A["Start (Initial)"] --> B["Step 1"]
B --> C["Step 2"]
C --> D["End"]
\`\`\`
   - You MUST use rich formatting to explain concepts clearly: Use ASCII flowcharts, code blocks, step-by-step logic, bold keywords, and bulleted lists.
4. SEPARATE RESOURCES AND TIPS on new lines (FOR EVERY SECTION 1 QUESTION):
    - EVERY single answer in SECTION 1 (Long Questions) MUST end with these 3 items. EACH ITEM MUST BE ON ITS OWN SEPARATE LINE with a BLANK LINE between them:

**Pro-Tip:** [Insert a useful exam tip or mnemonic]

**Web Search:** [Search Web for {Topic}](https://www.google.com/search?q={URL_ENCODED_TOPIC})

**YouTube:** [Watch Tutorial for {Topic}](https://www.youtube.com/results?search_query={URL_ENCODED_TOPIC})

    - CRITICAL: Replace \`{URL_ENCODED_TOPIC}\` with real URL-encoded text (e.g., \`FIRST+FOLLOW+Sets+CFG\`). NEVER output the literal placeholder text.
    - DO NOT use any emojis (no 💡🌍📺🧠) in the Pro-Tip, Web Search, or YouTube lines. Use ONLY the bold text labels shown above.
    - NEVER put Pro-Tip, Web Search, and YouTube on the SAME LINE. Each MUST be its own separate paragraph.
    - This is NON-NEGOTIABLE. EVERY Section 1 answer MUST have all 3 of these resource lines on SEPARATE lines.
    - Section 2 (Short) and Section 3 (MCQ) answers do NOT need resource links.
5. TYPOGRAPHY RESTRICTIONS(STRICT):
   - CRITICAL QUESTION SIZING: For EVERY SINGLE QUESTION across ALL 3 Sections, you MUST start the line with exactly '#### ' (Markdown Header 4). Examples: '#### Question 1: ', '#### Q1: ', '#### MCQ 1: '.
   - CRITICAL ANSWER SIZING(SECTION 2): You MUST NOT use ANY Markdown headers('#', '##', '###', '####') for the answers in Section 2. You MUST NOT use ANY asterisks('**').Prefix the answer text strictly with 'A: ' rather than 'Answer:'.It MUST be exactly: 'A: [Plain normal weight text]'.
   - MULTIPLE CHOICE FORMAT: Place the ✅ tick mark INLINE next to the correct option string.DO NOT make a separate "Correct Answer" line.

            CRITICAL - USE THIS EXACT MARKDOWN TEMPLATE AS YOUR FRAMEWORK:
## Unit ${targetUnit}

### SECTION 1: LONG EXPECTED QUESTIONS
#### Question 1: [Insert Question Here][${answerLength === 'Long' ? '10' : '5'} Marks]

** Answer:**
            [Insert concise, highly exam - specific bullet points.Stay strictly within the syllabus scope and structure the answer to efficiently secure maximum marks.]

            | Feature | Point A | Point B |
| ---|---|---|
| Example | Data | Data |

                [Optional ASCII Flowcharts / Diagrams if applicable]

**Pro-Tip:** [Insert tip]

**Web Search:** [Search Web for {Exact Topic Name}](https://www.google.com/search?q={URL_ENCODED_TOPIC})

**YouTube:** [Watch Tutorial for {Exact Topic Name}](https://www.youtube.com/results?search_query={URL_ENCODED_TOPIC})

---
#### Question 2: [Insert Question Here][${answerLength === 'Long' ? '10' : '5'} Marks]
... (Continue for all long expected questions in Unit ${targetUnit})

### SECTION 2: EXPECTED SHORT QUESTIONS(1 - 2 Marks)
#### Q1: [Insert Short Question Here]

        A: [Insert completely plain text explanation here without bolding]

        ---

#### Q2: [Insert Short Question Here]
... (Continue for all highly probable short questions)

### SECTION 3: EXPECTED MCQs
#### MCQ 1: [Insert Question Here]

            - A)[Option A]
                - B)[Option B] ✅
        - C)[Option C]
            - D)[Option D]

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

    } catch (error: unknown) {
        console.error('Generate Plan Error:', error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
    }
}
