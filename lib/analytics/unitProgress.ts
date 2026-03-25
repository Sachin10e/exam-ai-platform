'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getUnitProgress(subjectId: string, unitId: string): Promise<number> {
    try {
        if (!subjectId || !unitId) return 0;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        let query = supabase
            .from('study_events')
            .select('event_type')
            .eq('subject_id', subjectId)
            .eq('unit_id', unitId);

        if (user?.id) {
            query = query.eq('user_id', user.id);
        }

        const { data, error } = await query;
        if (error || !data) return 0;

        // Baseline progression formula per unit
        const EXPECTED_QUESTIONS = 3;
        const EXPECTED_FLASHCARDS = 1;
        const EXPECTED_MOCKS = 1;

        const TOTAL_ITEMS = EXPECTED_QUESTIONS + EXPECTED_FLASHCARDS + EXPECTED_MOCKS;

        let questionCount = 0;
        let flashcardCount = 0;
        let mockCount = 0;

        for (const event of data) {
            if (event.event_type === 'unit_completed') return 100; // Force 100% if explicitly finished
            
            if (event.event_type === 'question_asked') questionCount++;
            if (event.event_type === 'flashcard_review') flashcardCount++;
            if (event.event_type === 'mock_test') mockCount++;
        }

        const completedItems = 
            Math.min(questionCount, EXPECTED_QUESTIONS) +
            Math.min(flashcardCount, EXPECTED_FLASHCARDS) +
            Math.min(mockCount, EXPECTED_MOCKS);

        const progress = Math.round((completedItems / TOTAL_ITEMS) * 100);
        return Math.min(progress, 100);
    } catch (e) {
        console.error('Failed to get unit progress:', e);
        return 0;
    }
}
