-- =======================================================
-- 1. FIX POLL VOTING
-- =======================================================

-- Create a trigger function to accurately count poll votes
CREATE OR REPLACE FUNCTION update_poll_option_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE poll_options
    SET vote_count = vote_count + 1
    WHERE id = NEW.poll_option_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE poll_options
    SET vote_count = vote_count - 1
    WHERE id = OLD.poll_option_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS trigger_update_poll_option_vote_count ON poll_votes;
CREATE TRIGGER trigger_update_poll_option_vote_count
AFTER INSERT OR DELETE ON poll_votes
FOR EACH ROW
EXECUTE FUNCTION update_poll_option_vote_count();

-- Allow users to insert their own votes
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert a vote" ON poll_votes;
CREATE POLICY "Anyone can insert a vote" ON poll_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =======================================================
-- 2. "MY CIRCLE" (FOLLOWERS) SYSTEM
-- =======================================================

-- Create the followers table
CREATE TABLE IF NOT EXISTS followers (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view followers" ON followers;
CREATE POLICY "Anyone can view followers" ON followers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add to circle" ON followers;
CREATE POLICY "Users can add to circle" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can remove from circle" ON followers;
CREATE POLICY "Users can remove from circle" ON followers FOR DELETE USING (auth.uid() = follower_id);

-- Add columns to profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='followers_count') THEN
    ALTER TABLE profiles ADD COLUMN followers_count INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='following_count') THEN
    ALTER TABLE profiles ADD COLUMN following_count INT DEFAULT 0;
  END IF;
END $$;

-- Trigger to keep profile counts perfectly in sync
CREATE OR REPLACE FUNCTION update_profile_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_follower_counts ON followers;
CREATE TRIGGER trigger_update_profile_follower_counts
AFTER INSERT OR DELETE ON followers
FOR EACH ROW
EXECUTE FUNCTION update_profile_follower_counts();
