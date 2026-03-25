import { GoogleGenerativeAI } from '@google/generative-ai';
import { classifyQuestion } from './questionClassifier';
import { getTemplateForType } from './templates';
import { generateEmbedding } from '../embeddings';
import { createClient } from '@supabase/supabase-js';
import { AIResponse } from '../../app/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. RAG Context Extraction (Phase 0)
export async function retrieveContext(subjectId: string, query: string): Promise<string> {
    if (!subjectId) return '';
    try {
        const queryEmbedding = await generateEmbedding(query);
        const { data: chunks, error } = await supabase.rpc('match_chunks', {
            query_embedding: queryEmbedding,
            match_threshold: 0.15,
            match_count: 10,
            p_subject_id: subjectId
        });

        if (error) {
            console.error('[Answer Engine] RAG retrieval failure:', error);
            return '';
        }

        if (chunks && chunks.length > 0) {
            return chunks.map((c: { content: string }) => c.content).join('\n\n');
        }
} catch (err) {
        console.error('[Answer Engine] Embed/Retrieve Error:', err);
    }
    return '';
}

export interface ArenaParams {
    urgency?: 'Cram' | 'Deep';
    targetGrade?: 'Pass' | 'Top';
    answerLength?: 'Short' | 'Long';
    explanationStyle?: 'Simplified' | 'Academic';
    targetUnit?: number;
}

// Multi-Pass Execution Controller
export async function generateMultiPassAnswerStream(
    subjectId: string,
    query: string,
    history: AIResponse[],
    arenaParams?: ArenaParams,
    guestContextText?: string
) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Fast explicit reasoning model

    // Extract heuristics
    const questionType = classifyQuestion(query);
    const structureTemplate = getTemplateForType(questionType);
    
    // FAST PATH: If this is the "Generate More Questions" macro, skip heavy RAG and 3-pass sequential generation
    if (query.includes('Generate 2 MORE expected Long Questions')) {
        console.log('[Answer Engine] Commencing Fast Path for Generate More Questions');
        const fastPrompt = `
You are an expert academic tutor.
Context history:
${history.map((m: AIResponse) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n---NEXT MESSAGE---\n')}

User Request: "${query}"

CRITICAL INSTRUCTIONS:
1. Ensure you follow the EXACT visual formatting requested in the previous messages.
2. Underneath EVERY Long Question's answer, you MUST append a Pro-Tip and these exact formatted Markdown links on new lines:
   💡 Pro-Tip: [Insert tip]
   [🌍 Search Web for {Exact Topic Name}](https://www.google.com/search?q={URL_ENCODED_TOPIC})
   [📺 Watch YouTube Tutorial for {Exact Topic Name}](https://www.youtube.com/results?search_query={URL_ENCODED_TOPIC})
   (Replace {URL_ENCODED_TOPIC} and {Exact Topic Name} with the specific sub-topic being discussed).
        `;
        return await model.generateContentStream(fastPrompt);
    }

    const contextText = guestContextText || await retrieveContext(subjectId, query);

    const baseSystemPrompt = `
You are an expert academic tutor and university professor preparing a student for an exam.
Context from their explicit Syllabus:
${contextText ? contextText : 'No explicit document context. Rely on generic elite academic knowledge.'}

CONVERSATION HISTORY TO PRESERVE CONTEXT:
${history.map((m: AIResponse) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n---NEXT MESSAGE---\n')}
`;

    const dynamicDirectives = arenaParams ? `
=== DYNAMIC STUDY ARENA CONSTRAINTS ===
${arenaParams.urgency === 'Cram' ? 'URGENCY: "Tomorrow". You MUST be highly concise. Skip unnecessary intro/outro fluff.' : 'URGENCY: "Deep Study". Provide meticulous conceptual detail and theoretical foundations.'}
${arenaParams.targetGrade === 'Top' ? 'GRADE TARGET: "Top Ranker". Substantially emphasize robust examples, edge-cases, and elite academic insights to secure max marks.' : 'GRADE TARGET: "Guaranteed Pass". Focus exclusively on the safest, high-yield minimum viable logic.'}
${arenaParams.answerLength === 'Short' ? 'DEPTH: "Fast & Concise". Force maximum brevity. Limit to bulleted key points.' : 'DEPTH: "10-Mark Detailed". Produce a massive, rigorously structured top-tier university essay mapping.'}
${arenaParams.explanationStyle === 'Simplified' ? 'TONE: "Simple intuition". Avoid extreme jargon. Explain via easy analogies.' : 'TONE: "Rigorous Academic". Enforce strict university terminology and formal syntax.'}
=======================================
` : '';

    // PASS 1: Raw Generative Explanation (Data Assembly)
    console.log('[Answer Engine] Commencing Pass 1: Fact Assembly');
    const pass1Prompt = `
${baseSystemPrompt}
Analyze the student's question: "${query}"
Generate a comprehensive, raw foundational explanation combining their syllabus context and factual deep domain knowledge. Do not worry about formatting yet, purely focus on the academic substance, mechanisms, definitions, and theory.
    `.trim();

    let rawExplanation = '';
    try {
        const pass1Result = await model.generateContent(pass1Prompt);
        rawExplanation = pass1Result.response.text();
    } catch (e) {
        console.error('[Answer Engine] Pass 1 Failed', e);
        rawExplanation = "Failed to generate initial logic. Please try again.";
    }

    // PASS 2: Exam-Structured Formatting (Pedagogy Assembly)
    console.log('[Answer Engine] Commencing Pass 2: Pedagogical Structuring');
    const pass2Prompt = `
${baseSystemPrompt}
You are given a raw foundational academic explanation to the student's query ("${query}").
Raw Explanation: 
${rawExplanation}

TASK: Convert this raw material into an elite, highly-structured university exam-style answer.
Classified formatting requirement: ${questionType.toUpperCase()}
Template rules: ${structureTemplate}

${dynamicDirectives}

Ensure everything is perfectly grouped and clearly understandable for exam retention. Output the revised text natively.
    `.trim();

    let structuredAnswer = '';
    try {
         const pass2Result = await model.generateContent(pass2Prompt);
         structuredAnswer = pass2Result.response.text();
    } catch (e) {
         console.error('[Answer Engine] Pass 2 Failed', e);
         structuredAnswer = rawExplanation; // Fallback to raw
    }

    // PASS 3: Visual & Rich Component Synthesis (Streamed to Client)
    console.log('[Answer Engine] Commencing Pass 3: Visual Augmentation & Stream');
    const pass3Prompt = `
You are the final rendering engine for an Elite AI Tutor platform. 
Here is the structurally completed academic answer to the user's question ("${query}"):

${structuredAnswer}

TASK: Synthesize the final definitive Markdown output combining the structured answer above with injected visual teaching aids natively WHERE APPLICABLE.
- Add Markdown tables if the query is a comparison.
- Add Mermaid flowcharts if explaining a sequential process. (CRITICAL: wrap all labels in double quotes, NO text on edges).
- Add Mermaid component diagrams (using flowchart subgraphs) if explaining architectural structure.
- Add LaTeX math equations (using $$ blocks) if algorithms or math are explicitly mentioned.
- Keep the existing high-quality structured text, but seamlessly weave these complex visual markdown structures into the response where they elevate learning.
- FOR ANY MAJOR ANSWER OR CONCEPT, YOU MUST APPEND THESE LINKS AT THE VERY END:
  💡 Pro-Tip: [Insert relevant tip]
  [🌍 Search Web for {Exact Topic Name}](https://www.google.com/search?q={URL_ENCODED_TOPIC})
  [📺 Watch YouTube Tutorial for {Exact Topic Name}](https://www.youtube.com/results?search_query={URL_ENCODED_TOPIC})
  (Ensure you replace the braces with the actual URL-encoded concept name!)

Now, return the definitive finalized markdown answer.
    `.trim();

    // The final pass streams so the user doesn't wait an eternity for 3 consecutive blocking AI passes.
    return await model.generateContentStream(pass3Prompt);
}
