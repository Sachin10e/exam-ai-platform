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
    const defaultMetrics: ProgressMetrics = {
        studyStreak: 0,
        weakTopics: [],
        progressPercentage: 0,
        totalStudyHours: 0,
        mockExamAvg: 0
    };

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return defaultMetrics;
        }

        // a) For totalStudyHours
        const { data: durationData } = await supabase
            .from('study_events')
            .select('duration')
            .eq('user_id', user.id)
            .eq('event_type', 'study_session');
            
        let totalStudyHours = 0;
        if (durationData) {
            const totalMinutes = durationData.reduce((sum, row) => sum + (row.duration || 0), 0);
            totalStudyHours = parseFloat((totalMinutes / 60).toFixed(1));
        }

        // b) For mockExamAvg
        const { data: scoreData } = await supabase
            .from('study_events')
            .select('score')
            .eq('user_id', user.id)
            .eq('event_type', 'mock_test');
            
        let mockExamAvg = 0;
        if (scoreData && scoreData.length > 0) {
            const validScores = scoreData.filter(row => typeof row.score === 'number');
            if (validScores.length > 0) {
                const totalScore = validScores.reduce((sum, row) => sum + (row.score || 0), 0);
                mockExamAvg = Math.round(totalScore / validScores.length);
            }
        }

        // c) For studyStreak
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: streakData } = await supabase
            .from('study_events')
            .select('created_at')
            .eq('user_id', user.id)
            .eq('event_type', 'study_session')
            .gte('created_at', sevenDaysAgo.toISOString());

        let studyStreak = 0;
        if (streakData) {
            const uniqueDates = new Set(streakData.map(row => row.created_at.split('T')[0]));
            studyStreak = uniqueDates.size;
        }

        return {
            studyStreak,
            weakTopics: [],
            progressPercentage: 0,
            totalStudyHours,
            mockExamAvg
        };
    } catch (error) {
        console.error('Error fetching progress metrics:', error);
        return defaultMetrics;
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
