-- Multi-Tenant Migration Script: User Data Segregation & RLS Policies
-- This script injects user_id into all core tables and hardens the database with strict Row Level Security.

-- 1. Ensure flashcards and mock_exams tables exist before altering them
CREATE TABLE IF NOT EXISTS flashcards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
    unit_id text,
    front text NOT NULL,
    back text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS mock_exams (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
    unit_id text,
    questions jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS topic_stats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
    topic_name text NOT NULL,
    accuracy numeric DEFAULT 0,
    attempts integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS pyq_questions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
    year integer,
    question_text text NOT NULL,
    answer_text text,
    marks integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Inject user_id references into all core tables
-- NOTE: If tables already have data, adding a NOT NULL constraint without a default will fail. 
-- For migration, we add it, set a default to a dummy user if needed, or just add it normally if db is fresh.
-- Since we rely on auth.users(id), we use a standard approach.

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE study_events ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE mock_exams ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE preps ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE topic_stats ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE pyq_questions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- 3. Create Indices on user_id for massive Performance scaling
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_events_user_id ON study_events(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_exams_user_id ON mock_exams(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_stats_user_id ON topic_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_pyq_questions_user_id ON pyq_questions(user_id);

-- 4. Enable Strict Row Level Security (RLS) across all isolated tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE preps ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE pyq_questions ENABLE ROW LEVEL SECURITY;

-- 5. Purge legacy Anonymous/Public Policies (Optional safety precaution depending on previous state)
-- DROP POLICY IF EXISTS "Enable read access for all users" ON study_sessions;
-- DROP POLICY IF EXISTS "Enable insert access for all users" ON study_sessions;
-- DROP POLICY IF EXISTS "Enable update access for all users" ON study_sessions;
-- DROP POLICY IF EXISTS "Enable delete access for all users" ON study_sessions;

-- 6. Deploy Hardened user_id RLS Policies
-- SUBJECTS
DROP POLICY IF EXISTS "Users can fully manage their own subjects" ON subjects;
CREATE POLICY "Users can fully manage their own subjects" ON subjects 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DOCUMENTS (Uploads)
DROP POLICY IF EXISTS "Users can fully manage their own documents" ON documents;
CREATE POLICY "Users can fully manage their own documents" ON documents 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- STUDY SESSIONS
DROP POLICY IF EXISTS "Users can fully manage their own sessions" ON study_sessions;
CREATE POLICY "Users can fully manage their own sessions" ON study_sessions 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- STUDY EVENTS (Progress / Analytics)
DROP POLICY IF EXISTS "Users can fully manage their own study events" ON study_events;
CREATE POLICY "Users can fully manage their own study events" ON study_events 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- FLASHCARDS
DROP POLICY IF EXISTS "Users can fully manage their own flashcards" ON flashcards;
CREATE POLICY "Users can fully manage their own flashcards" ON flashcards 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- MOCK EXAMS
DROP POLICY IF EXISTS "Users can fully manage their own mock exams" ON mock_exams;
CREATE POLICY "Users can fully manage their own mock exams" ON mock_exams 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NOTES
DROP POLICY IF EXISTS "Users can fully manage their own notes" ON notes;
CREATE POLICY "Users can fully manage their own notes" ON notes 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PREPS
DROP POLICY IF EXISTS "Users can fully manage their own preps" ON preps;
CREATE POLICY "Users can fully manage their own preps" ON preps 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TOPIC STATS
DROP POLICY IF EXISTS "Users can fully manage their own topic stats" ON topic_stats;
CREATE POLICY "Users can fully manage their own topic stats" ON topic_stats 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PYQ QUESTIONS
DROP POLICY IF EXISTS "Users can fully manage their own PYQs" ON pyq_questions;
CREATE POLICY "Users can fully manage their own PYQs" ON pyq_questions 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
