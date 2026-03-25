'use server';

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateEmbedding } from '../embeddings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getTopicExplanation(subjectId: string, topicName: string, description: string) {
    if (!subjectId || !topicName) {
         return { success: false, error: 'Missing required parameters.' };
    }

    try {
        // 1. Vectorize the exact Node Identity
        const queryVector = await generateEmbedding(`${topicName}: ${description}`);

        // 2. Extract highly-correlated syllabus document chunks exactly bounded to the Subject
        const { data: chunks, error: matchError } = await supabase.rpc('match_chunks', {
            query_embedding: queryVector,
            match_threshold: 0.65,
            match_count: 4,
            p_subject_id: subjectId
        });

        if (matchError) {
            console.error('[Knowledge Graph] Chunk resolution fault:', matchError);
            return { success: false, error: 'Failed to extract semantic source chunks.' };
        }

        const contextText = (chunks || []).map((c: { content: string }) => c.content).join('\n\n');

        // 3. Initiate rigorous Gemini explanation generation
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
You are an expert AI tutor. A student has clicked on a syllabus topic node in their Knowledge Graph.
Topic: "${topicName}"
Short Description: "${description}"

Use the following exact extracted text from their syllabus to teach them everything they need to know structurally:
${contextText ? contextText : 'No additional explicit context extracted, provide a highly factual academic definition.'}

Format the output intelligently in markdown:
- Use clear bullet points and bolding for core terms
- Keep it concise but comprehensive (max 2-3 paragraphs)
        `;

        const result = await model.generateContent(prompt);
        const explanation = result.response.text();

        return { 
             success: true, 
             explanation 
        };

    } catch (e: unknown) {
        console.error('[Knowledge Graph] Explanation engine fault:', e);
        return { success: false, error: 'Internal AI generation cycle failed.' };
    }
}
