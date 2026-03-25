'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface ExamPrediction {
    id: number;
    topic: string;
    frequency: string;
    importance: 'High' | 'Medium' | 'Low';
}

const STOP_WORDS = new Set([
     "about", "above", "after", "again", "against", "all", "and", "any", "are", "because", "been", "before", "being", "below", "between", "both", "their", "there", "these", "those", "through", "under", "until", "which", "while", "would", "could", "should", "where", "there", 
    // Academic exact matches
    "chapter", "unit", "page", "section", "question", "questions", "marks", "exam", "paper", "syllabus", "subject", "part", "answer", "write", "explain", "describe", "define", "discuss", "short", "long", "notes", "briefly", "detail", "following", "given", "using", "first", "second", "third", "four", "five"
]);

export async function getExamPredictions(): Promise<ExamPrediction[]> {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        // 1. Fetch subjects explicitly for this user (or all if anonymous)
        let subjectQuery = supabase.from('subjects').select('id');
        if (user?.id && !userError) {
            subjectQuery = subjectQuery.eq('user_id', user.id);
        }
        
        const { data: subjects } = await subjectQuery;
        const subjectIds = subjects?.map(s => s.id) || [];

        // 2. Fetch documents for these subjects
        let docQuery = supabase.from('documents').select('full_text, filename');
        if (subjectIds.length > 0) {
            docQuery = docQuery.in('subject_id', subjectIds);
        }
        
        // Safety cap to prevent memory exhaustion on gigantic libraries during NLP sweep
        docQuery = docQuery.limit(20);
        
        const { data: documents, error } = await docQuery;
        if (error || !documents || documents.length === 0) return [];

        const frequencyMap: Record<string, number> = {};

        // 3. NLP Term Frequency Analysis (Syllabus vs PYQ weighting)
        for (const doc of documents) {
            if (!doc.full_text) continue;

            // PYQ (Previous Year Questions) get 3x weight for higher probability
            const isPyq = doc.filename.toLowerCase().match(/(pyq|exam|question|paper|test|past)/);
            const weight = isPyq ? 3 : 1; 

            const text = doc.full_text.toLowerCase();
            // Match alphabetic words 5-25 characters long 
            const words = text.match(/[a-z]{5,25}/g) || [];
            
            for (const word of words) {
                if (!STOP_WORDS.has(word)) {
                    frequencyMap[word] = (frequencyMap[word] || 0) + weight;
                }
            }
        }

        // 4. Rank and slice Top 5
        const sortedEntries = Object.entries(frequencyMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return sortedEntries.map((entry, idx) => {
            const word = entry[0];
            const rawFreq = entry[1];
            const capitalizedTopic = word.charAt(0).toUpperCase() + word.slice(1);
            
            let importance: 'High' | 'Medium' | 'Low' = 'Low';
            if (rawFreq > 25) importance = 'High';
            else if (rawFreq > 10) importance = 'Medium';

            return {
                id: idx + 1,
                topic: capitalizedTopic,
                frequency: `${rawFreq} mentions`,
                importance
            };
        });

    } catch (e) {
        console.error('Failed to get exam predictions:', e);
        return [];
    }
}
