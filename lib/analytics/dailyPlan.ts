'use server';

import { createClient } from '@supabase/supabase-js';
import { getWeakTopics } from './weakTopics';
import { getExamPredictions } from './examPredictions';
import { getUnitProgress } from './unitProgress';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface DailyTaskDef {
    id: string;
    title: string;
    status: 'pending' | 'completed';
    link: string;
}

export async function getDailyPlan(): Promise<DailyTaskDef[]> {
    try {
        const tasks: DailyTaskDef[] = [];
        let idCounter = 1;

        // 1. Weak Topics (Priority)
        const weakTopics = await getWeakTopics();
        
        for (const wt of weakTopics.slice(0, 1)) {
            tasks.push({
                id: `task-${idCounter++}`,
                title: `Revise ${wt.topic.includes('Unit') ? wt.topic : `Unit ${parseInt(wt.topic) || wt.topic}`}`,
                status: 'pending',
                link: '/arena?type=mock'
            });
        }

        // 2. Incomplete Units (Find units logged in study_events that are NOT completed)
        const { data: { user } } = await supabase.auth.getUser();
        let query = supabase.from('study_events').select('unit_id, event_type, subject_id').not('unit_id', 'is', null);
        if (user?.id) {
            query = query.eq('user_id', user.id);
        }
        
        const { data: events } = await query;
        const subjectIds = new Set<string>();
        
        if (events && events.length > 0) {
            const unitStatusMap: Record<string, { subjectId: string, hasMock: boolean, hasFlashcard: boolean, completed: boolean }> = {};
            
            events.forEach(e => {
                subjectIds.add(e.subject_id);
                if (!unitStatusMap[e.unit_id]) {
                    unitStatusMap[e.unit_id] = { subjectId: e.subject_id, hasMock: false, hasFlashcard: false, completed: false };
                }
                if (e.event_type === 'mock_test') unitStatusMap[e.unit_id].hasMock = true;
                if (e.event_type === 'flashcard_review') unitStatusMap[e.unit_id].hasFlashcard = true;
                if (e.event_type === 'unit_completed') unitStatusMap[e.unit_id].completed = true;
            });

            const incompleteUnits = Object.keys(unitStatusMap).filter(u => !unitStatusMap[u].completed);
            
            // Generate tasks based on missing components
            for (const uid of incompleteUnits) {
                const map = unitStatusMap[uid];
                const progress = await getUnitProgress(map.subjectId, uid);
                
                if (progress < 100) {
                    if (!map.hasMock) {
                        if (!tasks.find(t => t.title.includes(`Unit ${uid} Mock`))) {
                            tasks.push({
                                id: `task-${idCounter++}`,
                                title: `Take Unit ${uid} Mock Test`,
                                status: 'pending',
                                link: '/arena?type=mock'
                            });
                        }
                    } else if (!map.hasFlashcard) {
                         if (!tasks.find(t => t.title.includes('Flashcard'))) {
                            tasks.push({
                                id: `task-${idCounter++}`,
                                title: `Review Unit ${uid} Flashcards`,
                                status: 'pending',
                                link: '/arena?type=flashcard'
                            });
                        }
                    } else {
                        // General completion
                        if (!tasks.find(t => t.title.includes(`Complete Unit ${uid}`))) {
                           tasks.push({
                                id: `task-${idCounter++}`,
                                title: `Complete Unit ${uid} Studies`,
                                status: 'pending',
                                link: '/arena'
                            }); 
                        }
                    }
                }
                if (tasks.length >= 4) break; // Leave room for predictions
            }
        }

        // 3. Upcoming Exam Topics (Predictions)
        if (tasks.length < 5) {
            const predictions = await getExamPredictions();
            for (const pred of predictions.slice(0, 2)) {
                if (!tasks.find(t => t.title.includes(pred.topic))) {
                    tasks.push({
                        id: `task-${idCounter++}`,
                        title: `Study predicted topic: ${pred.topic}`,
                        status: 'pending',
                        link: '/arena'
                    });
                }
                if (tasks.length >= 5) break;
            }
        }

        // Fallbacks if perfectly clean database
        if (tasks.length === 0) {
            tasks.push(
                { id: `task-${idCounter++}`, title: 'Upload your syllabus or PYQ document', status: 'pending', link: '/arena' },
                { id: `task-${idCounter++}`, title: 'Generate your first Study Plan', status: 'pending', link: '/arena' },
                { id: `task-${idCounter++}`, title: 'Complete a diagnostic Mock Test', status: 'pending', link: '/arena' }
            );
        }

        return tasks.slice(0, 5);
    } catch (e) {
        console.error('Failed to get daily plan', e);
        return [];
    }
}
