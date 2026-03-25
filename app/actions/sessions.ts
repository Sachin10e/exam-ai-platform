'use server';

import { AIResponse } from '../types';
import { createClient } from '@/utils/supabase/server';

export interface StudySessionMeta {
    id: string;
    title: string;
    created_at: string;
    metadata?: Record<string, unknown>;
}

export interface StudySession extends StudySessionMeta {
    messages: AIResponse[];
}

/**
 * Saves a generated study plan to the Supabase database.
 */
export async function saveSession(title: string, messages: AIResponse[], id?: string, metadata?: Record<string, unknown>) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return { success: true, guest: true };
        }

        const payload: Record<string, unknown> = { 
            user_id: user.id, 
            title, 
            messages,
            updated_at: new Date().toISOString()
        };
        
        if (id) payload.id = id;
        if (metadata) payload.metadata = metadata;

        const { data, error } = await supabase
            .from('study_sessions')
            .upsert([payload])
            .select()
            .single();

        if (error) {
            console.error('Supabase save error:', error);
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Failed to save session:', error);
        return { success: false, error: 'Failed to save session to cloud.' };
    }
}

/**
 * Fetches all past study sessions (metadata only) for the History Sidebar.
 */
export async function getSessions(): Promise<StudySessionMeta[]> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return [];

        const { data, error } = await supabase
            .from('study_sessions')
            .select('id, title, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50); // Keep sidebar performant

        if (error) {
            console.error('Supabase fetch error:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Failed to fetch sessions:', error);
        return [];
    }
}

/**
 * Loads a specific session's full message stream.
 */
export async function getSessionById(id: string): Promise<StudySession | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data, error } = await supabase
            .from('study_sessions')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Supabase fetch by ID error:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Failed to fetch session detail:', error);
        return null;
    }
}
