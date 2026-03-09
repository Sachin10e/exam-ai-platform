-- Run this script in your Supabase SQL Editor to create the history table.

CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  messages jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous reads and inserts (since we aren't using strict Auth yet)
-- This allows the frontend to save and load sessions seamlessly!
CREATE POLICY "Enable read access for all users" ON study_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON study_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON study_sessions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON study_sessions FOR DELETE USING (true);
