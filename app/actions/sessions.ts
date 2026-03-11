'use server';

import { createClient } from '@supabase/supabase-js';
import { AIResponse } from '../types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// We use the service_role key here to bypass RLS policies natively inside the secure Node.js server action
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface StudySessionMeta {
    id: string;
    title: string;
    created_at: string;
}

export interface StudySession extends StudySessionMeta {
    messages: AIResponse[];
}

/**
 * Saves a generated study plan to the Supabase database.
 */
export async function saveSession(title: string, messages: AIResponse[], id?: string) {
    try {
        const payload: { title: string; messages: AIResponse[]; id?: string } = { title, messages };
        if (id) payload.id = id;

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
        const { data, error } = await supabase
            .from('study_sessions')
            .select('id, title, created_at')
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
        const { data, error } = await supabase
            .from('study_sessions')
            .select('*')
            .eq('id', id)
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
