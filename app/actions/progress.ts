'use server'

/**
 * PHASE 5 PROGRESS TRACKING
 * This module is completely safe and isolated. It generates placeholder analytics 
 * data to feed the new Recharts and Dashboard Metric components without altering
 * or breaking the actual Supabase database schemas.
 */
import { createClient } from '@/utils/supabase/server';

export type ProgressMetrics = {
    studyStreak: number;
    weakTopics: string[];
    progressPercentage: number;
    totalStudyHours: number;
    mockExamAvg: number;
}

export async function getProgressMetrics(): Promise<ProgressMetrics> {
    // Simulated API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
        studyStreak: 12,
        weakTopics: ['Thermodynamics', 'Data Structures', 'Microeconomics'],
        progressPercentage: 68,
        totalStudyHours: 42.5,
        mockExamAvg: 84
    }
}

export type WeeklyActivity = {
    day: string;
    hours: number;
}

export async function getWeeklyActivity(): Promise<WeeklyActivity[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [
            { day: 'Sun', hours: 0 }, { day: 'Mon', hours: 0 }, { day: 'Tue', hours: 0 },
            { day: 'Wed', hours: 0 }, { day: 'Thu', hours: 0 }, { day: 'Fri', hours: 0 }, { day: 'Sat', hours: 0 }
        ];
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: Record<string, number> = {};
    const dateToDayMap: Record<string, string> = {};

    // Generate last 7 days chronologically
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayStr = days[d.getDay()];
        dateToDayMap[dateStr] = dayStr;
        result[dayStr] = 0;
    }

    let query = supabase
        .from('study_events')
        .select('duration, created_at')
        .eq('event_type', 'study_session')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (user?.id) {
        query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (!error && data) {
        data.forEach(event => {
            const dateStr = new Date(event.created_at).toISOString().split('T')[0];
            const dayStr = dateToDayMap[dateStr];
            if (dayStr) {
                // Assuming duration is logged in minutes, converting to hours
                result[dayStr] += (event.duration || 0) / 60;
            }
        });
    }

    const output: WeeklyActivity[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = days[d.getDay()];
        output.push({ day: dayStr, hours: parseFloat(result[dayStr].toFixed(1)) });
    }

    return output;
}

export type MockTestScore = {
    id: string;
    topic: string;
    score: number;
}

export async function getMockTestScores(): Promise<MockTestScore[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('study_events')
        .select('id, score, created_at')
        .eq('event_type', 'mock_test')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(15);

    if (error || !data) return [];

    return data.map((event, index) => ({
        id: (index + 1).toString(),
        topic: `Test ${index + 1}`,
        score: event.score || 0
    }));
}
