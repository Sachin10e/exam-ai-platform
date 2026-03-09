-- ========================================================================
-- PRO-PREP AI: "START FRESH" SUPABASE RESET SCRIPT
-- Run this in your Supabase SQL Editor to wipe old data but keep the 
-- smart deduplication structure.
-- ========================================================================

-- 1. 🔥 WIPE ALL OLD DATA (This cascades to delete all old Documents and Chunks instantly)
TRUNCATE TABLE subjects CASCADE;

-- 2. Enable the cryptographic extension for the new uploads
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Add the deduplication hash column to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- 4. Add a Unique Constraint to strictly block future duplicates at the database layer.
--    (If a unique constraint already exists, this is safe to run again or ignore its error)
ALTER TABLE documents ADD CONSTRAINT unique_file_hash UNIQUE (file_hash);

-- DONE. Your database is now completely empty and fully protected against future duplicates! 🚀
