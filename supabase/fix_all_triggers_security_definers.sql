-- ====================================================================
-- RAMBHAHOO BACKEND SECURITY & DATA INTEGRITY FIX
-- Paste this script into the Supabase SQL Editor and run it.
-- This script fixes:
-- 1. SECURITY DEFINER status on statistics triggers (so normal users can follow, comment, react, and vote).
-- 2. Check constraint on notifications table (to accept code-level uppercase notification types).
-- 3. Missing INSERT RLS policy on notifications table (so notifications can be created successfully).
-- ====================================================================

-- ====================================================================
-- PART 1: NOTIFICATIONS TABLE FIXES
-- ====================================================================

-- 1. Drop old type check constraint and add the new one supporting code-level types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'like', 'comment', 'mention', 'follow', 'rsvp',
  'POST_LIKE', 'POST_REACTION', 'POST_COMMENT', 'COMMENT_REPLY',
  'POLL_VOTE', 'CIRCLE_ADD', 'MENTION', 'POST_REPORT', 'SYSTEM', 'EVENT_RSVP'
));

-- 2. Drop and recreate the INSERT policy for notifications
DROP POLICY IF EXISTS "Users can create notifications as actor." ON public.notifications;
CREATE POLICY "Users can create notifications as actor."
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = actor_id);


-- ====================================================================
-- PART 2: TRIGGER FUNCTIONS SECURITY FIXES (Bypass RLS for Aggregations)
-- ====================================================================

-- 1. Fix followers_count & following_count trigger function
CREATE OR REPLACE FUNCTION public.update_follower_counts()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 2. Fix comment_count trigger function
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    UPDATE public.profiles SET comment_count = comment_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    UPDATE public.profiles SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Fix reaction_count & reputation_score trigger function
CREATE OR REPLACE FUNCTION public.update_reaction_count()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN UPDATE public.posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN UPDATE public.comments SET reaction_count = reaction_count + 1 WHERE id = NEW.comment_id; END IF;
    -- Reputation Points: 2 points per reaction received on a post
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.profiles SET reputation_score = reputation_score + 2 WHERE id = (SELECT user_id FROM public.posts WHERE id = NEW.post_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN UPDATE public.posts SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF OLD.comment_id IS NOT NULL THEN UPDATE public.comments SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.comment_id; END IF;
    IF OLD.post_id IS NOT NULL THEN
      UPDATE public.profiles SET reputation_score = GREATEST(reputation_score - 2, 0) WHERE id = (SELECT user_id FROM public.posts WHERE id = OLD.post_id);
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Fix poll vote_count trigger function
CREATE OR REPLACE FUNCTION public.update_poll_vote_count()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.poll_options SET vote_count = vote_count + 1 WHERE id = NEW.poll_option_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.poll_options SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.poll_option_id; END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
