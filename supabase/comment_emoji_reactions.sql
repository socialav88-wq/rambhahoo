-- ====================================================================
-- MIGRATION: RAMBHAHOO NATIVE EMOJI REACTION SYSTEM
-- ====================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard.
-- 2. Go to the SQL Editor in the left sidebar.
-- 3. Click "New Query".
-- 4. Paste the entire content of this script and click "Run".
-- ====================================================================

-- 1. Clean up any existing duplicate post reactions (keep only the newest)
DELETE FROM public.reactions a USING public.reactions b
WHERE a.created_at < b.created_at 
  AND a.user_id = b.user_id 
  AND a.post_id = b.post_id;

-- 2. Clean up any existing duplicate comment reactions (keep only the newest)
DELETE FROM public.reactions a USING public.reactions b
WHERE a.created_at < b.created_at 
  AND a.user_id = b.user_id 
  AND a.comment_id = b.comment_id;

-- 3. Drop existing constraints
ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS reactions_emoji_check;
ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS unique_comment_reaction;
ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS unique_post_reaction;

-- 4. Add new unique constraints to allow only one reaction per user per comment/post
ALTER TABLE public.reactions ADD CONSTRAINT unique_comment_user_reaction UNIQUE (user_id, comment_id);
ALTER TABLE public.reactions ADD CONSTRAINT unique_post_user_reaction UNIQUE (user_id, post_id);

-- 5. Update Notification types check constraint to accept COMMENT_REACTION
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'like', 'comment', 'mention', 'follow', 'rsvp',
  'POST_LIKE', 'POST_REACTION', 'POST_COMMENT', 'COMMENT_REPLY', 'COMMENT_REACTION',
  'POLL_VOTE', 'CIRCLE_ADD', 'MENTION', 'POST_REPORT', 'SYSTEM', 'EVENT_RSVP'
));

-- 6. Update Comments DELETE RLS policy to allow comment creator OR post owner to delete comments
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = comments.post_id
      AND posts.user_id = auth.uid()
    )
  );
