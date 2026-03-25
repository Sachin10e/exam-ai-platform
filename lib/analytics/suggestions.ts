'use server';

import { createClient } from '@supabase/supabase-js';
import { getWeakTopics } from './weakTopics';
import { getExamPredictions } from './examPredictions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface SuggestionDef {
    id: number;
    title: string;
    description: string;
    icon: 'Target' | 'Zap' | 'BookCheck';
    iconColor: string;
    actionText: string;
    actionLink: string;
    borderColor: string;
}

export async function getStudySuggestions(): Promise<SuggestionDef[]> {
    try {
        const suggestions: SuggestionDef[] = [];
        let idCounter = 1;

        // 1. Weak Topics (Priority 1)
        const weakTopics = await getWeakTopics();
        
        for (const wt of weakTopics.slice(0, 2)) {
            suggestions.push({
                id: idCounter++,
                title: `Revise ${wt.topic}`,
                description: `You scored ${wt.confidence}% in recent mocks for this topic. Generating a focused Mock Test is highly recommended to fill knowledge gaps.`,
                icon: 'Target',
                iconColor: 'text-amber-400',
                actionText: 'Start Revision',
                actionLink: `/arena?type=mock`,
                borderColor: 'border-amber-500/20'
            });
        }

        if (suggestions.length >= 3) return suggestions;

        // 2. Upcoming / NLP Exam Predictions (Priority 2)
        const predictions = await getExamPredictions();
        
        for (const pred of predictions.filter(p => p.importance === 'High').slice(0, 1)) {
            suggestions.push({
                id: idCounter++,
                title: `Master ${pred.topic}`,
                description: `AI Predicts this topic is highly requested in upcoming exams (${pred.frequency}). We strongly advise generating notes on this.`,
                icon: 'Zap',
                iconColor: 'text-emerald-400',
                actionText: 'Generate Notes',
                actionLink: `/arena`,
                borderColor: 'border-emerald-500/20'
            });
            if (suggestions.length >= 3) return suggestions;
        }

        // 3. Stale Topics - unstudied for > 7 days (Priority 3)
        const { data: { user } } = await supabase.auth.getUser();
        
        let queryAll = supabase.from('study_events').select('unit_id').not('unit_id', 'is', null);
        let queryRecent = supabase.from('study_events').select('unit_id').not('unit_id', 'is', null).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        
        if (user?.id) {
            queryAll = queryAll.eq('user_id', user.id);
            queryRecent = queryRecent.eq('user_id', user.id);
        }

        const [allEvents, recentEvents] = await Promise.all([queryAll, queryRecent]);
        
        const allUnits = new Set(allEvents.data?.map(e => e.unit_id) || []);
        const recentUnits = new Set(recentEvents.data?.map(e => e.unit_id) || []);
        
        const staleUnits: string[] = [];
        for (const unit of allUnits) {
            if (!recentUnits.has(unit)) {
                staleUnits.push(unit);
            }
        }

        for (const stale of staleUnits) {
            const formattedStale = stale.toLowerCase().includes('unit') ? stale : `Unit ${stale}`;
            // Deduplicate if already present from weak topic
            if (!suggestions.find(s => s.title.includes(formattedStale))) {
                suggestions.push({
                    id: idCounter++,
                    title: `Review ${formattedStale} Flashcards`,
                    description: `You haven't studied this syllabus node recently. Quick conceptual repetition strengthens neural pathways before exams.`,
                    icon: 'BookCheck',
                    iconColor: 'text-fuchsia-400',
                    actionText: 'Start Revision',
                    actionLink: `/arena?type=flashcard`,
                    borderColor: 'border-fuchsia-500/20'
                });
                if (suggestions.length >= 3) return suggestions;
            }
        }

        // Generic Fallback
        if (suggestions.length === 0) {
             suggestions.push({
                id: idCounter++,
                title: `Take a Baseline Mock Exam`,
                description: `Complete a dynamic mock exam to establish your analytics baseline and unlock deeper, customized AI insights.`,
                icon: 'Zap',
                iconColor: 'text-emerald-400',
                actionText: 'Start Mock Exam',
                actionLink: `/arena?type=mock`,
                borderColor: 'border-emerald-500/20'
            });
        }

        return suggestions;
    } catch (e) {
        console.error('Failed to get study suggestions', e);
        return [];
    }
}
