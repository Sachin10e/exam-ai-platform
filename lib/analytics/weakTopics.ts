'use server';

import { createClient } from '@/utils/supabase/server';

export interface WeakTopicDef {
    id: number;
    topic: string;
    confidence: number;
    action: string;
    explanation: string;
}

export async function getWeakTopics(): Promise<WeakTopicDef[]> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return [];

        const query = supabase
            .from('study_events')
            .select('unit_id, score')
            .eq('event_type', 'mock_test')
            .eq('user_id', user.id)
            .not('score', 'is', null);

        const { data, error } = await query;
        if (error || !data) return [];

        // 1. Group questions (events) by topic (unit_id)
        const unitScores: Record<string, { total: number; count: number }> = {};
        
        data.forEach(event => {
            if (event.score === null || event.score === undefined) return;
            const unit = event.unit_id || 'General Concepts';
            
            if (!unitScores[unit]) {
                unitScores[unit] = { total: 0, count: 0 };
            }
            unitScores[unit].total += event.score;
            unitScores[unit].count += 1;
        });

        // 2 & 3. Calculate accuracy percentage and flag if < 60%
        const weakTopics: WeakTopicDef[] = [];
        let idCounter = 1;

        for (const [unit, stats] of Object.entries(unitScores)) {
            const avgScore = Math.round(stats.total / stats.count);
            
            // If accuracy < 60%: flag topic as weak
            if (avgScore < 60) {
                weakTopics.push({
                    id: idCounter++,
                    topic: unit.toLowerCase().includes('unit') ? unit : `Unit ${unit}`,
                    confidence: avgScore,
                    action: 'Review Flashcards',
                    explanation: `Your mock test accuracy for this unit dropped to ${avgScore}%. We highly suggest generating focused flashcards or retaking practice quizzes to fill knowledge gaps.`
                });
            }
        }

        // Sort by most critical (lowest score) first
        return weakTopics.sort((a, b) => a.confidence - b.confidence);

    } catch (e) {
        console.error('Failed to get weak topics:', e);
        return [];
    }
}
