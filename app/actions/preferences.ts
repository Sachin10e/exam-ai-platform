'use server';

import { createClient } from '@/utils/supabase/server';

export async function setLastSessionId(sessionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase
        .from('user_preferences')
        .upsert({ 
            user_id: user.id, 
            last_session_id: sessionId, 
            updated_at: new Date().toISOString() 
        });
}

export async function getLastSessionId(): Promise<string | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data } = await supabase
        .from('user_preferences')
        .select('last_session_id')
        .eq('user_id', user.id)
        .single();

    return data?.last_session_id || null;
}
