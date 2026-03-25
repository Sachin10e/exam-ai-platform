'use server';

import { createClient } from '@/utils/supabase/server';

export type EventType = 
  | 'study_session'
  | 'mock_test'
  | 'flashcard_review'
  | 'unit_completed'
  | 'question_asked';

export interface EventData {
  subject_id?: string;
  unit_id?: string;
  event_type: EventType;
  duration?: number;
  score?: number;
}

export async function logStudyEvent(data: EventData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return { success: true, guest: true };
    }

    const userId = user.id;

    const { error } = await supabase
      .from('study_events')
      .insert({
        user_id: userId,
        subject_id: data.subject_id || null,
        unit_id: data.unit_id || null,
        event_type: data.event_type,
        duration: data.duration || null,
        score: data.score || null,
      });

    if (error) {
      console.error('Failed to log study event:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error logging study event:', err);
    return { success: false, error: 'Internal server error' };
  }
}
