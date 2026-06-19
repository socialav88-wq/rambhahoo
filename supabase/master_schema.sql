-- =================================================================================
-- tapri-images - MASTER DATABASE SCHEMA (V1)
-- Full initialization script including Tables, PostGIS, RLS, Functions, & Triggers
-- =================================================================================

-- --------------------------------------------------------
-- 0. CLEANUP (Drop existing to rebuild fresh)
-- --------------------------------------------------------
DROP TABLE IF EXISTS public.event_rsvps CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.poll_votes CASCADE;
DROP TABLE IF EXISTS public.poll_options CASCADE;
DROP TABLE IF EXISTS public.reactions CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.followers CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.localities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- --------------------------------------------------------
-- 1. EXTENSIONS
-- --------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- --------------------------------------------------------
-- 2. CORE TABLES
-- --------------------------------------------------------

-- PROFILES (Linked to Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  city TEXT DEFAULT 'Hyderabad',
  neighborhood TEXT,
  locality_id UUID, -- Will be linked after localities table is created
  reputation_score INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  search_tsv tsvector,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOCALITIES (Neighborhoods/Cities)
CREATE TABLE public.localities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📍',
  city TEXT DEFAULT 'Hyderabad',
  location geography(POINT),
  radius_meters INTEGER DEFAULT 5000,
  post_count INTEGER DEFAULT 0,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add the missing foreign key to profiles now that localities exists
ALTER TABLE public.profiles 
  ADD CONSTRAINT fk_profiles_locality 
  FOREIGN KEY (locality_id) REFERENCES public.localities(id) ON DELETE SET NULL;

-- POSTS (Polymorphic content: discussion, meme, poll, event)
CREATE TABLE public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  locality_id UUID REFERENCES public.localities(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('discussion', 'meme', 'poll', 'event')),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  image_url TEXT,
  location geography(POINT), -- Specific GPS location of the post
  tags TEXT[] DEFAULT '{}',
  reaction_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  search_tsv tsvector,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMMENTS
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reaction_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REACTIONS
CREATE TABLE public.reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_post_reaction UNIQUE(user_id, post_id, emoji),
  CONSTRAINT unique_comment_reaction UNIQUE(user_id, comment_id, emoji),
  CONSTRAINT reaction_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- POLLS
CREATE TABLE public.poll_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE public.poll_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  poll_option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_poll_vote UNIQUE(user_id, post_id)
);

-- EVENTS
CREATE TABLE public.events (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE PRIMARY KEY,
  event_date TIMESTAMPTZ NOT NULL,
  location_name TEXT,
  rsvp_count INTEGER DEFAULT 0
);

CREATE TABLE public.event_rsvps (
  post_id UUID REFERENCES public.events(post_id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- SOCIAL GRAPH
CREATE TABLE public.followers (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'like', 'comment', 'mention', 'follow', 'rsvp',
    'POST_LIKE', 'POST_REACTION', 'POST_COMMENT', 'COMMENT_REPLY',
    'POLL_VOTE', 'CIRCLE_ADD', 'MENTION', 'POST_REPORT', 'SYSTEM', 'EVENT_RSVP'
  )),
  reference_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 3. INDEXES (Performance)
-- --------------------------------------------------------
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_locality_id ON public.posts(locality_id);
CREATE INDEX idx_posts_slug ON public.posts(slug);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_location ON public.posts USING GIST(location);
CREATE INDEX idx_posts_search ON public.posts USING GIN(search_tsv);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_profiles_search ON public.profiles USING GIN(search_tsv);

-- --------------------------------------------------------
-- 4. FUNCTIONS & TRIGGERS (Auto-updates & Calculations)
-- --------------------------------------------------------

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on Supabase Auth Signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'Rambhahoo User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-generate unique slugs for posts
CREATE OR REPLACE FUNCTION generate_slug(title TEXT) RETURNS TEXT AS $$
DECLARE
  base_slug TEXT; final_slug TEXT;
BEGIN
  base_slug := left(trim(both '-' from regexp_replace(regexp_replace(lower(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g')), '\s+', '-', 'g'), '-+', '-', 'g')), 60);
  final_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_generate_post_slug() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN NEW.slug := generate_slug(NEW.title); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_slug BEFORE INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION auto_generate_post_slug();

-- Update Full Text Search Vectors
CREATE OR REPLACE FUNCTION post_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv := setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') || setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;
CREATE TRIGGER post_search_tsv_trigger BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION post_search_vector_update();

CREATE OR REPLACE FUNCTION profile_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv := setweight(to_tsvector('english', coalesce(NEW.username, '')), 'A') || setweight(to_tsvector('english', coalesce(NEW.display_name, '')), 'B') || setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;
CREATE TRIGGER profile_search_tsv_trigger BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION profile_search_vector_update();

-- Aggregate Counts (Followers, Reactions, Comments, Polls)
CREATE OR REPLACE FUNCTION update_follower_counts() RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER trigger_follower_counts AFTER INSERT OR DELETE ON public.followers FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

CREATE OR REPLACE FUNCTION update_post_comment_count() RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER trigger_comment_count AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

CREATE OR REPLACE FUNCTION update_reaction_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN UPDATE public.posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN UPDATE public.comments SET reaction_count = reaction_count + 1 WHERE id = NEW.comment_id; END IF;
    -- Reputation Points (Example: 2 points per reaction received on a post)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER trigger_reaction_count AFTER INSERT OR DELETE ON public.reactions FOR EACH ROW EXECUTE FUNCTION update_reaction_count();

CREATE OR REPLACE FUNCTION update_poll_vote_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.poll_options SET vote_count = vote_count + 1 WHERE id = NEW.poll_option_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.poll_options SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.poll_option_id; END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER trigger_poll_vote_count AFTER INSERT OR DELETE ON public.poll_votes FOR EACH ROW EXECUTE FUNCTION update_poll_vote_count();

CREATE OR REPLACE FUNCTION update_event_rsvp_count() RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER trigger_event_rsvp_count AFTER INSERT OR UPDATE OR DELETE ON public.event_rsvps FOR EACH ROW EXECUTE FUNCTION update_event_rsvp_count();

-- --------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Public can read almost everything
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Localities are viewable by everyone." ON public.localities FOR SELECT USING (true);
CREATE POLICY "Posts are viewable by everyone." ON public.posts FOR SELECT USING (true);
CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT USING (true);
CREATE POLICY "Reactions are viewable by everyone." ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Poll options are viewable by everyone." ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Poll votes are viewable by everyone." ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Events are viewable by everyone." ON public.events FOR SELECT USING (true);
CREATE POLICY "Followers are viewable by everyone." ON public.followers FOR SELECT USING (true);

-- Owners can edit their own data
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create posts." ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts." ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts." ON public.posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can create comments." ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments." ON public.comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments." ON public.comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can create reactions." ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions." ON public.reactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can create poll options." ON public.poll_options FOR INSERT WITH CHECK (true); -- Inserted via server action

CREATE POLICY "Users can vote on polls." ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their vote." ON public.poll_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can follow others." ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow." ON public.followers FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "Users can see own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark notifications read." ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can create notifications as actor." ON public.notifications FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- Event RSVPs Policies
CREATE POLICY "Event RSVPs are viewable by everyone." ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can create event RSVPs." ON public.event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own event RSVPs." ON public.event_rsvps FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own event RSVPs." ON public.event_rsvps FOR DELETE USING (auth.uid() = user_id);

-- Events Table Policies (based on underlying post ownership)
CREATE POLICY "Events are viewable by everyone." ON public.events FOR SELECT USING (true);
CREATE POLICY "Users can create events." ON public.events FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = events.post_id
    AND posts.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update own events." ON public.events FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = events.post_id
    AND posts.user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete own events." ON public.events FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = events.post_id
    AND posts.user_id = auth.uid()
  )
);

-- --------------------------------------------------------
-- 6. POSTGIS RPC (Nearby Feed)
-- --------------------------------------------------------
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
  profiles JSONB,
  localities JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.user_id, p.title, p.slug, p.content, p.post_type, p.image_url, p.locality_id, p.tags, p.reaction_count, p.comment_count, p.view_count, p.created_at, p.updated_at,
    ST_Distance(p.location, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography) AS distance_meters,
    jsonb_build_object('username', pr.username, 'display_name', pr.display_name, 'avatar_url', pr.avatar_url) AS profiles,
    CASE WHEN l.id IS NOT NULL THEN jsonb_build_object('slug', l.slug, 'name', l.name, 'emoji', l.emoji) ELSE NULL END AS localities
  FROM public.posts p
  LEFT JOIN public.profiles pr ON p.user_id = pr.id
  LEFT JOIN public.localities l ON p.locality_id = l.id
  WHERE p.location IS NOT NULL
    AND ST_DWithin(p.location, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography, radius_meters)
  ORDER BY distance_meters ASC, p.created_at DESC;
END;
$$;

-- --------------------------------------------------------
-- 7. INITIAL SEED DATA
-- --------------------------------------------------------
INSERT INTO public.localities (slug, name, emoji, city) VALUES 
  ('hitech-city', 'HITEC City', '🏢', 'Hyderabad'),
  ('kondapur', 'Kondapur', '🌳', 'Hyderabad'),
  ('gachibowli', 'Gachibowli', '🏟️', 'Hyderabad'),
  ('jubilee-hills', 'Jubilee Hills', '✨', 'Hyderabad'),
  ('banjara-hills', 'Banjara Hills', '☕', 'Hyderabad'),
  ('madhapur', 'Madhapur', '💻', 'Hyderabad'),
  ('kukatpally', 'Kukatpally', '🛍️', 'Hyderabad'),
  ('secunderabad', 'Secunderabad', '🚂', 'Hyderabad')
ON CONFLICT (slug) DO NOTHING;

-- --------------------------------------------------------
-- 8. STORAGE BUCKETS
-- --------------------------------------------------------
-- Note: Requires superuser/storage admin. Run in dashboard.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tapri-images', 'tapri-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'tapri-images' );

CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'tapri-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update own media" 
ON storage.objects FOR UPDATE 
USING ( auth.uid() = owner ) WITH CHECK ( bucket_id = 'tapri-images' );

CREATE POLICY "Users can delete own media" 
ON storage.objects FOR DELETE 
USING ( auth.uid() = owner AND bucket_id = 'tapri-images' );

-- Enable Realtime for all core tables safely
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY['posts', 'comments', 'reactions', 'poll_options', 'poll_votes', 'profiles', 'notifications', 'followers', 'event_rsvps'];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
