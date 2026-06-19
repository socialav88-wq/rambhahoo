-- =========================================================================
-- Rambhahoo SEO, Discover & Platform Growth Migration
-- =========================================================================

-- 1. Add category and is_indexable columns to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'discussion';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_indexable BOOLEAN DEFAULT true;

-- 2. Add CHECK constraint for category
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS check_post_category;
ALTER TABLE public.posts ADD CONSTRAINT check_post_category 
  CHECK (category IN ('discussion', 'question', 'recommendation', 'news', 'confession', 'opinion', 'battle', 'meme'));

-- 3. Create indexes for performance in filtering & sitemap queries
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_is_indexable ON public.posts(is_indexable);

-- 4. Programmatic Test User Confirmation (Ensure any test users are confirmed)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email LIKE 'rambhahoo.test.%';

-- 5. Fix notifications table relationship for dynamic joins
-- 5.1. Remove any orphan notifications referencing non-existent posts
DELETE FROM public.notifications 
WHERE reference_id IS NOT NULL 
  AND reference_id NOT IN (SELECT id FROM public.posts)
  AND type NOT IN ('SYSTEM', 'CIRCLE_ADD', 'follow');

-- 5.2. Add foreign key constraint to enable PostgREST joins on reference_id
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS fk_notifications_posts;
ALTER TABLE public.notifications 
  ADD CONSTRAINT fk_notifications_posts 
  FOREIGN KEY (reference_id) REFERENCES public.posts(id) ON DELETE CASCADE;
