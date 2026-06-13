-- =======================================================
-- RAMBHAHOO MASTER BACKEND FIX (SECURITY BYPASS)
-- =======================================================

-- 1. FIX POLL VOTES (SECURITY DEFINER)
-- Bypasses RLS so normal users can safely increment poll_options count
CREATE OR REPLACE FUNCTION update_poll_option_vote_count()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE poll_options
    SET vote_count = vote_count + 1
    WHERE id = NEW.poll_option_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE poll_options
    SET vote_count = GREATEST(vote_count - 1, 0)
    WHERE id = OLD.poll_option_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_poll_vote_count ON poll_votes;
CREATE TRIGGER trigger_poll_vote_count
AFTER INSERT OR DELETE ON poll_votes
FOR EACH ROW EXECUTE FUNCTION update_poll_option_vote_count();


-- 2. FIX CIRCLE COUNTS (SECURITY DEFINER)
-- Bypasses RLS so followers_count and following_count update successfully
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_follower_counts ON followers;
CREATE TRIGGER trigger_follower_counts
AFTER INSERT OR DELETE ON followers
FOR EACH ROW EXECUTE FUNCTION update_follower_counts();


-- 3. FIX COMMENT COUNTS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_post_comment_count ON comments;
CREATE TRIGGER trigger_post_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();


-- 4. ENABLE REALTIME ON NOTIFICATIONS AND POLL OPTIONS
-- This allows our frontend to instantly listen to these tables
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_options;
