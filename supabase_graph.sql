-- KNOWLEDGE GRAPH MODULE SCHEMA
-- Paste this script into your Supabase SQL Editor and hit "Run"

-- 1. Create the base 'topics' nodes
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    importance INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the precise directional 'topic_edges' links
CREATE TABLE IF NOT EXISTS public.topic_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_topic UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    target_topic UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    relation TEXT NOT NULL CHECK (relation IN ('prerequisite', 'related', 'extension', 'example_of')),
    weight NUMERIC DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_edge UNIQUE (source_topic, target_topic, relation)
);

-- 3. Enable RLS (Row Level Security) safely for Anon/Auth operations
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read access to topics"
ON public.topics FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow all insert access to topics"
ON public.topics FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow all update access to topics"
ON public.topics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all read access to topic_edges"
ON public.topic_edges FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow all insert access to topic_edges"
ON public.topic_edges FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow all update access to topic_edges"
ON public.topic_edges FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
