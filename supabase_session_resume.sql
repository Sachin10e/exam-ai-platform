-- SQL Migration: Cross-Device Session Resume & UI Metadata Tracking
-- Run this script in your Supabase SQL Editor.

-- 1. Add jsonb metadata to study_sessions to persist targetUnit, parameters, and progress
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 2. Create user_preferences table to explicitly record the last active session ID
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_session_id uuid REFERENCES study_sessions(id) ON DELETE SET NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS and Lockdown
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own preferences" ON user_preferences;
CREATE POLICY "Users manage their own preferences" ON user_preferences 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
