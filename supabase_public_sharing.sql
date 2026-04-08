-- Migration to add public sharing flag to study plans
-- Apply this entirely in your Supabase SQL Editor

ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_study_sessions_public ON study_sessions(id) WHERE is_public = true;

CREATE POLICY "Public sessions are viewable by everyone" ON study_sessions
FOR SELECT USING (is_public = true);
