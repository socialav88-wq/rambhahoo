-- ============================================
-- RAMBHAHOO - PHASE 1 DATABASE MIGRATION
-- Adds PostGIS, Reputation, Followers, and Location Tracking
-- ============================================

-- 1. Enable PostGIS for GPS location tracking (Nearby Feed)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Update Profiles for Reputation and Followers
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS search_tsv tsvector;

-- 3. Update Localities with Geographic Data
ALTER TABLE public.localities
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS location geography(POINT),
  ADD COLUMN IF NOT EXISTS radius_meters INTEGER;

-- 4. Update Posts with GPS Location
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS location geography(POINT),
  ADD COLUMN IF NOT EXISTS search_tsv tsvector;

-- 5. Create Followers Table for Social Graph
CREATE TABLE IF NOT EXISTS public.followers (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- 6. Follower Count Triggers
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
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
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_counts();

-- 7. Add full text search trigger for Profiles
CREATE OR REPLACE FUNCTION profile_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('english', coalesce(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.display_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profile_search_tsv_trigger ON public.profiles;
CREATE TRIGGER profile_search_tsv_trigger
  BEFORE INSERT OR UPDATE OF username, display_name, bio
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION profile_search_vector_update();

-- Update existing profiles TSV
UPDATE public.profiles SET id = id; -- triggers the update

-- ============================================
-- 8. PostGIS Nearby Feed RPC
-- ============================================
CREATE OR REPLACE FUNCTION get_nearby_posts(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  slug TEXT,
  content TEXT,
  post_type TEXT,
  image_url TEXT,
  locality_id UUID,
  tags TEXT[],
  reaction_count INTEGER,
  comment_count INTEGER,
  view_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance_meters DOUBLE PRECISION,
  -- JSON relationships for Next.js to match standard select
  profiles JSONB,
  localities JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.title,
    p.slug,
    p.content,
    p.post_type,
    p.image_url,
    p.locality_id,
    p.tags,
    p.reaction_count,
    p.comment_count,
    p.view_count,
    p.created_at,
    p.updated_at,
    -- Calculate distance
    ST_Distance(p.location, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography) AS distance_meters,
    -- Join profiles as JSONB
    jsonb_build_object(
      'username', pr.username,
      'display_name', pr.display_name,
      'avatar_url', pr.avatar_url
    ) AS profiles,
    -- Join localities as JSONB
    CASE WHEN l.id IS NOT NULL THEN
      jsonb_build_object(
        'slug', l.slug,
        'name', l.name,
        'emoji', l.emoji
      )
    ELSE NULL END AS localities
  FROM public.posts p
  LEFT JOIN public.profiles pr ON p.user_id = pr.id
  LEFT JOIN public.localities l ON p.locality_id = l.id
  WHERE p.location IS NOT NULL
    AND ST_DWithin(p.location, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography, radius_meters)
  ORDER BY distance_meters ASC, p.created_at DESC;
END;
$$;
