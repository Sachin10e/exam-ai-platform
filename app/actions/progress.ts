'use server'

/**
 * PHASE 5 PROGRESS TRACKING
 * This module is completely safe and isolated. It generates placeholder analytics 
 * data to feed the new Recharts and Dashboard Metric components without altering
 * or breaking the actual Supabase database schemas.
 */

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
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
        { day: 'Mon', hours: 2.5 },
        { day: 'Tue', hours: 3.8 },
        { day: 'Wed', hours: 1.2 },
        { day: 'Thu', hours: 4.5 },
        { day: 'Fri', hours: 2.0 },
        { day: 'Sat', hours: 6.0 },
        { day: 'Sun', hours: 4.2 },
    ]
}

export type MockTestScore = {
    topic: string;
    score: number;
}

export async function getMockTestScores(): Promise<MockTestScore[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
        { topic: 'Mid 1', score: 65 },
        { topic: 'Quiz 1', score: 72 },
        { topic: 'Mid 2', score: 68 },
        { topic: 'Final Prep', score: 85 },
        { topic: 'Mock 1', score: 91 },
    ]
}
