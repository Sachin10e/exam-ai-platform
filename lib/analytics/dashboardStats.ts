'use server';

import { createClient } from '@/utils/supabase/server';

export interface DashboardStats {
  pdfCount: number;
  plansGenerated: number;
  mockAverageScore: number;
  studyStreak: number;
  bestStreak: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  let pdfCount = 0;
  let plansGenerated = 0;
  let mockAverageScore = 0;
  let studyStreak = 0;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { pdfCount: 0, plansGenerated: 0, mockAverageScore: 0, studyStreak: 0, bestStreak: 0 };
    }

    // 1. pdfCount: count uploads in documents
    const { count: docsCount, error: docsErr } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (!docsErr && docsCount !== null) {
      pdfCount = docsCount;
    }

    // 2. plansGenerated: count study plans from study_sessions
    const { count: plansCount, error: plansErr } = await supabase
      .from('study_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (!plansErr && plansCount !== null) {
      plansGenerated = plansCount;
    }

    // 3. mockAverageScore & 4. studyStreak/bestStreak: pull from study_events
    const { data: events, error: eventsErr } = await supabase
       .from('study_events')
       .select('score, created_at, event_type')
       .eq('user_id', user.id);

    if (!eventsErr && events && events.length > 0) {
      // Calculate Average Score
      const mockEvents = events.filter(e => e.event_type === 'mock_test' && typeof e.score === 'number');
      if (mockEvents.length > 0) {
        const totalScore = mockEvents.reduce((acc, curr) => acc + (curr.score || 0), 0);
        mockAverageScore = Math.round(totalScore / mockEvents.length);
      }

      // Calculate Study Streak (Consecutive Days backwards from Today/Yesterday)
      // Extract unique local dates of activity
      const activitySet = new Set<string>();
      events.forEach(e => {
        // Convert ISO to YYYY-MM-DD
        const dateStr = new Date(e.created_at).toISOString().split('T')[0];
        activitySet.add(dateStr);
      });

      const uniqueDates = Array.from(activitySet).sort((a, b) => b.localeCompare(a));
      
      if (uniqueDates.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

        let currentStreak = 0;
        let checkDate = new Date();

        // 1) Calc Current Streak backwards from Today/Yesterday
        if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
           if (!uniqueDates.includes(todayStr)) {
              checkDate = yesterdayDate;
           }

           while (true) {
               const checkStr = checkDate.toISOString().split('T')[0];
               if (uniqueDates.includes(checkStr)) {
                   currentStreak++;
                   checkDate.setDate(checkDate.getDate() - 1);
               } else {
                   break;
               }
           }
        }
        studyStreak = currentStreak;

        // 2) Calc Best Streak from uniqueDates
        // uniqueDates is sorted descending. Reverse it to ascending.
        const ascendingDates = [...uniqueDates].reverse();
        let maxStreak = 0;
        let rollingStreak = 0;

        for (let i = 0; i < ascendingDates.length; i++) {
           if (i === 0) {
               rollingStreak = 1;
           } else {
               const prevDate = new Date(ascendingDates[i-1]);
               const currDate = new Date(ascendingDates[i]);
               const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
               if (diffDays === 1) {
                   rollingStreak++;
               } else {
                   rollingStreak = 1;
               }
           }
           if (rollingStreak > maxStreak) {
               maxStreak = rollingStreak;
           }
        }
        
        // Return structured dataset with extended parameters
        return {
          pdfCount,
          plansGenerated,
          mockAverageScore,
          studyStreak,
          bestStreak: maxStreak
        };
      }
    }

    return {
      pdfCount,
      plansGenerated,
      mockAverageScore,
      studyStreak,
      bestStreak: 0
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return {
      pdfCount: 0,
      plansGenerated: 0,
      mockAverageScore: 0,
      studyStreak: 0,
      bestStreak: 0
    };
  }
}
