-- ==========================================================
-- MIGRATION: FIX EVENT AND IMAGE POST TYPE CONSTRAINTS
-- ==========================================================
-- This script fixes the post_type constraint on the posts table
-- to allow 'event' and 'meme' (mapped from 'image') post types.
-- The NOT VALID flag ensures we do not fail on legacy test rows.

-- 1. Drop the existing mismatched constraint
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_post_type_check;

-- 2. Add the corrected constraint to allow discussion, meme, image, poll, and event
ALTER TABLE public.posts ADD CONSTRAINT posts_post_type_check 
  CHECK (post_type IN ('discussion', 'meme', 'image', 'poll', 'event')) NOT VALID;
