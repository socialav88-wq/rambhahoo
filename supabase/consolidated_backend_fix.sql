-- ====================================================================
-- RAMBHAHOO COMPLETE PLATFORM STABILITY & DATA INTEGRITY FIX
-- ====================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard.
-- 2. Go to the SQL Editor in the left sidebar.
-- 3. Click "New Query".
-- 4. Paste the entire content of this script and click "Run".
-- ====================================================================

-- ----------------------------------------------------
-- PART 1: NOTIFICATIONS TABLE FIXES
-- ----------------------------------------------------

-- 1. Update Notification type check constraint to accept uppercase types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'like', 'comment', 'mention', 'follow', 'rsvp',
  'POST_LIKE', 'POST_REACTION', 'POST_COMMENT', 'COMMENT_REPLY',
  'POLL_VOTE', 'CIRCLE_ADD', 'MENTION', 'POST_REPORT', 'SYSTEM', 'EVENT_RSVP'
));

-- 2. Add missing INSERT policy for notifications
DROP POLICY IF EXISTS "Users can create notifications as actor." ON public.notifications;
CREATE POLICY "Users can create notifications as actor." 
  ON public.notifications FOR INSERT 
  WITH CHECK (auth.uid() = actor_id);


-- ----------------------------------------------------
-- PART 2: TRIGGER FUNCTIONS SECURITY DEFINER UPGRADES
-- ----------------------------------------------------

-- 1. Followers trigger (bypasses RLS so counts update when followed)
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

DROP TRIGGER IF EXISTS trigger_follower_counts ON public.followers;
CREATE TRIGGER trigger_follower_counts
  AFTER INSERT OR DELETE ON public.followers
  FOR EACH ROW EXECUTE FUNCTION public.update_follower_counts();


-- 2. Comments count trigger (bypasses RLS to update counts)
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

DROP TRIGGER IF EXISTS trigger_comment_count ON public.comments;
CREATE TRIGGER trigger_comment_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comment_count();


-- 3. Reactions & Reputation points trigger (bypasses RLS to update stats)
CREATE OR REPLACE FUNCTION public.update_reaction_count()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN UPDATE public.posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN UPDATE public.comments SET reaction_count = reaction_count + 1 WHERE id = NEW.comment_id; END IF;
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

DROP TRIGGER IF EXISTS trigger_reaction_count ON public.reactions;
CREATE TRIGGER trigger_reaction_count
  AFTER INSERT OR DELETE ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.update_reaction_count();


-- 4. Poll votes trigger (bypasses RLS to update vote counts)
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

DROP TRIGGER IF EXISTS trigger_poll_vote_count ON public.poll_votes;
CREATE TRIGGER trigger_poll_vote_count
  AFTER INSERT OR DELETE ON public.poll_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_poll_vote_count();


-- 5. NEW: Event RSVPs trigger (automatically updates rsvp_count on events table)
CREATE OR REPLACE FUNCTION public.update_event_rsvp_count()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'going' THEN
      UPDATE public.events SET rsvp_count = rsvp_count + 1 WHERE post_id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'going' AND NEW.status = 'going' THEN
      UPDATE public.events SET rsvp_count = rsvp_count + 1 WHERE post_id = NEW.post_id;
    ELSIF OLD.status = 'going' AND NEW.status != 'going' THEN
      UPDATE public.events SET rsvp_count = GREATEST(rsvp_count - 1, 0) WHERE post_id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'going' THEN
      UPDATE public.events SET rsvp_count = GREATEST(rsvp_count - 1, 0) WHERE post_id = OLD.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_event_rsvp_count ON public.event_rsvps;
CREATE TRIGGER trigger_event_rsvp_count
  AFTER INSERT OR UPDATE OR DELETE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_event_rsvp_count();


-- ----------------------------------------------------
-- PART 3: ADDITIONAL RLS POLICY CORRECTIVES
-- ----------------------------------------------------

-- 1. Enable RLS and add policies for event_rsvps (previously completely locked)
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Event RSVPs are viewable by everyone." ON public.event_rsvps;
CREATE POLICY "Event RSVPs are viewable by everyone." ON public.event_rsvps FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create event RSVPs." ON public.event_rsvps;
CREATE POLICY "Users can create event RSVPs." ON public.event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own event RSVPs." ON public.event_rsvps;
CREATE POLICY "Users can update own event RSVPs." ON public.event_rsvps FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own event RSVPs." ON public.event_rsvps;
CREATE POLICY "Users can delete own event RSVPs." ON public.event_rsvps FOR DELETE USING (auth.uid() = user_id);


-- 2. Enable RLS and add policies for events table (prevents open write risks)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events are viewable by everyone." ON public.events;
CREATE POLICY "Events are viewable by everyone." ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create events." ON public.events;
CREATE POLICY "Users can create events." ON public.events FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = events.post_id
    AND posts.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own events." ON public.events;
CREATE POLICY "Users can update own events." ON public.events FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = events.post_id
    AND posts.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own events." ON public.events;
CREATE POLICY "Users can delete own events." ON public.events FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = events.post_id
    AND posts.user_id = auth.uid()
  )
);


-- 3. Add UPDATE RLS policy on comments table (allows comment editing)
DROP POLICY IF EXISTS "Users can update own comments." ON public.comments;
CREATE POLICY "Users can update own comments." ON public.comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ----------------------------------------------------
-- PART 4: REALTIME REPLICATION ENABLEMENT
-- ----------------------------------------------------

-- Ensure all tables are added to the supabase_realtime publication to trigger WebSocket sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_options;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.followers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rsvps;
