-- =======================================================
-- FIX POST TYPE CONSTRAINT (IGNORE EXISTING ROWS)
-- =======================================================

-- 1. Drop the old constraint completely
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check;

-- 2. Add it back using NOT VALID
-- This tells Supabase to allow the new rule WITHOUT checking the old broken rows!
ALTER TABLE posts ADD CONSTRAINT posts_post_type_check 
CHECK (post_type IN ('discussion', 'image', 'poll')) NOT VALID;
