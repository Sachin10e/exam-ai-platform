'use server';

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function generateTopicRelationships(subjectId: string) {
    if (!subjectId) return { success: false, error: 'Subject ID is required' };

    try {
        // 1. Fetch all current topics for exactly this subject jurisdiction
        const { data: topics, error: fetchErr } = await supabase
            .from('topics')
            .select('id, name, description')
            .eq('subject_id', subjectId);

        if (fetchErr || !topics || topics.length < 2) {
            return { success: false, error: 'Not enough topics to generate relationships.' };
        }

        // 2. Transpile node states for the contextual LLM pipeline
        const topicsContext = topics.map(t => `ID: ${t.id} | Name: ${t.name} | Desc: ${t.description}`).join('\n');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // 3. Command strict deterministic relation matching
        const prompt = `
You are an expert academic curriculum architect. Analyze the following list of strictly defined topics.
Map the conceptual relationships dynamically between them.

The ONLY allowed relation types are: "prerequisite", "related", "extension", "example_of".
Output a valid JSON array of objects representing these edges. Do not include markdown formatting or backticks.

Format strictly:
[
  {
    "source_topic": "EXACT_SOURCE_UUID",
    "target_topic": "EXACT_TARGET_UUID",
    "relation": "prerequisite",
    "weight": 1.0
  }
]

Topics:
${topicsContext}
        `;

        const result = await model.generateContent(prompt);
        let jsonStr = result.response.text().trim();
        
        if (jsonStr.startsWith('\`\`\`')) {
            jsonStr = jsonStr.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '');
        }

        const extractedEdges = JSON.parse(jsonStr) as Array<{
            source_topic: string;
            target_topic: string;
            relation: string;
            weight: number;
        }>;

        if (!Array.isArray(extractedEdges) || extractedEdges.length === 0) {
            return { success: false, message: 'No concrete edges parsed.' };
        }

        let insertedCount = 0;

        // 4. Safely pipe parsed semantic limits into the topic_edges schema avoiding duplication constraints
        for (const edge of extractedEdges) {
            if (!edge.source_topic || !edge.target_topic || !edge.relation) continue;

            // Only permit authorized ENUM values
            if (!['prerequisite', 'related', 'extension', 'example_of'].includes(edge.relation)) continue;

            const { error: insertErr } = await supabase.from('topic_edges').upsert(
                {
                    source_topic: edge.source_topic,
                    target_topic: edge.target_topic,
                    relation: edge.relation,
                    weight: edge.weight || 1.0
                },
                { onConflict: 'source_topic,target_topic,relation', ignoreDuplicates: true }
            );

            if (!insertErr) insertedCount++;
        }

        return { success: true, message: `Successfully resolved and mapped ${insertedCount} relational connections successfully.` };

    } catch (err: unknown) {
        console.error('[Knowledge Graph] Edge Mapping Error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown Server Execution Fault' };
    }
}
