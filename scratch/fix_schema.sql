-- ==========================================
-- RAMBHAHOO SCHEMA CACHE & COLUMN FIX
-- ==========================================

-- 1. Ensure the title column exists (in case it was accidentally dropped)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Untitled';

-- 2. Force PostgREST to refresh its schema cache to recognize the column
NOTIFY pgrst, 'reload schema';
