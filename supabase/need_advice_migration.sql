-- =========================================================================
-- Rambhahoo "Need Advice" Schema & Migration
-- =========================================================================

-- 1. CLEANUP (Drop existing to rebuild fresh if needed)
DROP TABLE IF EXISTS public.advice_updates CASCADE;
DROP TABLE IF EXISTS public.advice_followers CASCADE;
DROP TABLE IF EXISTS public.advice_post_reactions CASCADE;
DROP TABLE IF EXISTS public.advice_reply_ratings CASCADE;
DROP TABLE IF EXISTS public.advice_replies CASCADE;
DROP TABLE IF EXISTS public.advice_poll_votes CASCADE;
DROP TABLE IF EXISTS public.advice_poll_options CASCADE;
DROP TABLE IF EXISTS public.advice_posts CASCADE;

-- 2. CREATE TABLES

-- ADVICE POSTS
CREATE TABLE public.advice_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  locality_id UUID REFERENCES public.localities(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    'career', 'relationship', 'money', 'family', 'student', 'startup', 'local', 'personal', 'life_decisions', 'general'
  )),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  additional_details TEXT DEFAULT '',
  image_url TEXT,
  anonymous_mode BOOLEAN DEFAULT false,
  is_poll BOOLEAN DEFAULT false,
  followers_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  reaction_counts JSONB DEFAULT '{"🙏": 0, "☕": 0, "❤️": 0, "👏": 0, "🌟": 0}'::jsonb,
  search_tsv tsvector,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADVICE POLL OPTIONS
CREATE TABLE public.advice_poll_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  advice_post_id UUID REFERENCES public.advice_posts(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- ADVICE POLL VOTES
CREATE TABLE public.advice_poll_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  advice_post_id UUID REFERENCES public.advice_posts(id) ON DELETE CASCADE NOT NULL,
  poll_option_id UUID REFERENCES public.advice_poll_options(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_advice_poll_vote UNIQUE(user_id, advice_post_id)
);

-- ADVICE REPLIES
CREATE TABLE public.advice_replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  advice_post_id UUID REFERENCES public.advice_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_best_advice BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  very_helpful_count INTEGER DEFAULT 0,
  best_advice_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADVICE REPLY RATINGS
CREATE TABLE public.advice_reply_ratings (
  reply_id UUID REFERENCES public.advice_replies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('helpful', 'very_helpful', 'best_advice')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (reply_id, user_id)
);

-- ADVICE POST REACTIONS
CREATE TABLE public.advice_post_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  advice_post_id UUID REFERENCES public.advice_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL CHECK (emoji IN ('🙏', '☕', '❤️', '👏', '🌟')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_advice_post_reaction UNIQUE (user_id, advice_post_id, emoji)
);

-- ADVICE THREAD FOLLOWERS
CREATE TABLE public.advice_followers (
  advice_post_id UUID REFERENCES public.advice_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (advice_post_id, user_id)
);

-- ADVICE UPDATES (Author posted updates)
CREATE TABLE public.advice_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  advice_post_id UUID REFERENCES public.advice_posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX idx_advice_posts_category ON public.advice_posts(category);
CREATE INDEX idx_advice_posts_locality ON public.advice_posts(locality_id);
CREATE INDEX idx_advice_posts_slug ON public.advice_posts(slug);
CREATE INDEX idx_advice_posts_search ON public.advice_posts USING GIN(search_tsv);
CREATE INDEX idx_advice_replies_post_id ON public.advice_replies(advice_post_id);
CREATE INDEX idx_advice_poll_options_post_id ON public.advice_poll_options(advice_post_id);

-- 4. TIMESTAMPTZ UPDATES
CREATE TRIGGER trigger_advice_posts_updated_at BEFORE UPDATE ON public.advice_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_advice_replies_updated_at BEFORE UPDATE ON public.advice_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. SLUG GENERATOR & SEARCH TRIGGERS
CREATE OR REPLACE FUNCTION auto_generate_advice_post_slug() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN NEW.slug := generate_slug(NEW.title); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_advice_post_slug BEFORE INSERT ON public.advice_posts FOR EACH ROW EXECUTE FUNCTION auto_generate_advice_post_slug();

CREATE OR REPLACE FUNCTION advice_post_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_tsv := setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') || setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER advice_post_search_tsv_trigger BEFORE INSERT OR UPDATE ON public.advice_posts FOR EACH ROW EXECUTE FUNCTION advice_post_search_vector_update();

-- 6. SECURITY DEFINER COUNTER TRIGGERS

-- Replies count trigger
CREATE OR REPLACE FUNCTION public.update_advice_replies_count()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.advice_posts SET replies_count = replies_count + 1 WHERE id = NEW.advice_post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.advice_posts SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = OLD.advice_post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_advice_replies_count
  AFTER INSERT OR DELETE ON public.advice_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_advice_replies_count();

-- Followers count trigger
CREATE OR REPLACE FUNCTION public.update_advice_followers_count()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.advice_posts SET followers_count = followers_count + 1 WHERE id = NEW.advice_post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.advice_posts SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.advice_post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_advice_followers_count
  AFTER INSERT OR DELETE ON public.advice_followers
  FOR EACH ROW EXECUTE FUNCTION public.update_advice_followers_count();

-- Reaction JSONB calculator trigger
CREATE OR REPLACE FUNCTION public.update_advice_post_reaction_counts()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.advice_posts
    SET reaction_counts = jsonb_set(
      COALESCE(reaction_counts, '{"🙏": 0, "☕": 0, "❤️": 0, "👏": 0, "🌟": 0}'::jsonb),
      ARRAY[NEW.emoji],
      (COALESCE(reaction_counts->>NEW.emoji, '0')::int + 1)::text::jsonb
    )
    WHERE id = NEW.advice_post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.advice_posts
    SET reaction_counts = jsonb_set(
      COALESCE(reaction_counts, '{"🙏": 0, "☕": 0, "❤️": 0, "👏": 0, "🌟": 0}'::jsonb),
      ARRAY[OLD.emoji],
      (GREATEST(COALESCE(reaction_counts->>OLD.emoji, '0')::int - 1, 0))::text::jsonb
    )
    WHERE id = OLD.advice_post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_advice_post_reaction_counts
  AFTER INSERT OR DELETE ON public.advice_post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.update_advice_post_reaction_counts();

-- Reply helpful/quality ratings counter trigger
CREATE OR REPLACE FUNCTION public.update_advice_reply_ratings_counters()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.rating = 'helpful' THEN
      UPDATE public.advice_replies SET helpful_count = helpful_count + 1 WHERE id = NEW.reply_id;
    ELSIF NEW.rating = 'very_helpful' THEN
      UPDATE public.advice_replies SET very_helpful_count = very_helpful_count + 1 WHERE id = NEW.reply_id;
    ELSIF NEW.rating = 'best_advice' THEN
      UPDATE public.advice_replies SET best_advice_count = best_advice_count + 1 WHERE id = NEW.reply_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Decrement old rating
    IF OLD.rating = 'helpful' THEN
      UPDATE public.advice_replies SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.reply_id;
    ELSIF OLD.rating = 'very_helpful' THEN
      UPDATE public.advice_replies SET very_helpful_count = GREATEST(very_helpful_count - 1, 0) WHERE id = OLD.reply_id;
    ELSIF OLD.rating = 'best_advice' THEN
      UPDATE public.advice_replies SET best_advice_count = GREATEST(best_advice_count - 1, 0) WHERE id = OLD.reply_id;
    END IF;
    -- Increment new rating
    IF NEW.rating = 'helpful' THEN
      UPDATE public.advice_replies SET helpful_count = helpful_count + 1 WHERE id = NEW.reply_id;
    ELSIF NEW.rating = 'very_helpful' THEN
      UPDATE public.advice_replies SET very_helpful_count = very_helpful_count + 1 WHERE id = NEW.reply_id;
    ELSIF NEW.rating = 'best_advice' THEN
      UPDATE public.advice_replies SET best_advice_count = best_advice_count + 1 WHERE id = NEW.reply_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.rating = 'helpful' THEN
      UPDATE public.advice_replies SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.reply_id;
    ELSIF OLD.rating = 'very_helpful' THEN
      UPDATE public.advice_replies SET very_helpful_count = GREATEST(very_helpful_count - 1, 0) WHERE id = OLD.reply_id;
    ELSIF OLD.rating = 'best_advice' THEN
      UPDATE public.advice_replies SET best_advice_count = GREATEST(best_advice_count - 1, 0) WHERE id = OLD.reply_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_advice_reply_ratings_counters
  AFTER INSERT OR UPDATE OR DELETE ON public.advice_reply_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_advice_reply_ratings_counters();

-- Poll vote count trigger
CREATE OR REPLACE FUNCTION public.update_advice_poll_vote_counts()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.advice_poll_options SET vote_count = vote_count + 1 WHERE id = NEW.poll_option_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.advice_poll_options SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.poll_option_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_advice_poll_vote_counts
  AFTER INSERT OR DELETE ON public.advice_poll_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_advice_poll_vote_counts();

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.advice_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advice_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advice_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advice_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advice_reply_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advice_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advice_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advice_updates ENABLE ROW LEVEL SECURITY;

-- SELECT policies (Public access)
CREATE POLICY "Advice posts are viewable by everyone" ON public.advice_posts FOR SELECT USING (true);
CREATE POLICY "Advice poll options are viewable by everyone" ON public.advice_poll_options FOR SELECT USING (true);
CREATE POLICY "Advice poll votes are viewable by everyone" ON public.advice_poll_votes FOR SELECT USING (true);
CREATE POLICY "Advice replies are viewable by everyone" ON public.advice_replies FOR SELECT USING (true);
CREATE POLICY "Advice reply ratings are viewable by everyone" ON public.advice_reply_ratings FOR SELECT USING (true);
CREATE POLICY "Advice reactions are viewable by everyone" ON public.advice_post_reactions FOR SELECT USING (true);
CREATE POLICY "Advice followers are viewable by everyone" ON public.advice_followers FOR SELECT USING (true);
CREATE POLICY "Advice updates are viewable by everyone" ON public.advice_updates FOR SELECT USING (true);

-- WRITE policies (Restricted by Owner)
CREATE POLICY "Users can create advice posts" ON public.advice_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own advice posts" ON public.advice_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own advice posts" ON public.advice_posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert poll options for own posts" ON public.advice_poll_options FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.advice_posts WHERE id = advice_post_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update poll options for own posts" ON public.advice_poll_options FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.advice_posts WHERE id = advice_post_id AND user_id = auth.uid())
);

CREATE POLICY "Users can vote on advice polls" ON public.advice_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own advice poll votes" ON public.advice_poll_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can create advice replies" ON public.advice_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own advice replies (or post owner can mark best advice)" ON public.advice_replies FOR UPDATE 
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.advice_posts WHERE id = advice_post_id AND user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.advice_posts WHERE id = advice_post_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete own advice replies" ON public.advice_replies FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can rate advice replies" ON public.advice_reply_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own advice reply ratings" ON public.advice_reply_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own advice reply ratings" ON public.advice_reply_ratings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can react to advice posts" ON public.advice_post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own advice reactions" ON public.advice_post_reactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can follow advice posts" ON public.advice_followers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow advice posts" ON public.advice_followers FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Authors can write advice updates" ON public.advice_updates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.advice_posts WHERE id = advice_post_id AND user_id = auth.uid())
);
CREATE POLICY "Authors can delete advice updates" ON public.advice_updates FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.advice_posts WHERE id = advice_post_id AND user_id = auth.uid())
);

-- 8. UPDATE NOTIFICATION TYPES CONSTRAINT
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'like', 'comment', 'mention', 'follow', 'rsvp',
  'POST_LIKE', 'POST_REACTION', 'POST_COMMENT', 'COMMENT_REPLY',
  'POLL_VOTE', 'CIRCLE_ADD', 'MENTION', 'POST_REPORT', 'SYSTEM', 'EVENT_RSVP',
  'ADVICE_REPLY', 'ADVICE_REPLY_HELPFUL', 'ADVICE_BEST_SELECTION', 'ADVICE_POST_FOLLOW', 'ADVICE_FOLLOWER_NEW_REPLY', 'ADVICE_FOLLOWER_UPDATE', 'ADVICE_FOLLOWER_BEST'
));

-- 9. DYNAMIC TRENDING DECAY ALGORITHM FOR ADVICE
CREATE OR REPLACE FUNCTION public.get_trending_advice_posts_decayed(
  p_locality_id UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0
)
RETURNS SETOF public.advice_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.advice_posts p
  WHERE (p_locality_id IS NULL OR p.locality_id = p_locality_id)
    AND (p_category IS NULL OR p.category = p_category)
  ORDER BY (
    -- Helpful ratings (helpful: 1pt, very_helpful: 2pt, best_advice: 3pt)
    COALESCE((
      SELECT SUM(r.helpful_count * 1.0 + r.very_helpful_count * 2.0 + r.best_advice_count * 3.0)::NUMERIC 
      FROM public.advice_replies r 
      WHERE r.advice_post_id = p.id
    ), 0) + 
    -- Pinned best answer bonus (5pt)
    COALESCE((SELECT 5.0 FROM public.advice_replies r WHERE r.advice_post_id = p.id AND r.is_best_advice = true LIMIT 1), 0) +
    -- Total replies weight
    p.replies_count * 3.0 + 
    -- Followers weight
    p.followers_count * 2.0 + 
    -- Reactions weight
    COALESCE((
      SELECT SUM((val)::int) 
      FROM jsonb_each_text(COALESCE(p.reaction_counts, '{"🙏": 0, "☕": 0, "❤️": 0, "👏": 0, "🌟": 0}'::jsonb)) AS t(key, val)
    ), 0) * 1.0
  ) / POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 + 2, 1.5) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 10. REALTIME ENABLEMENT safely
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY['advice_posts', 'advice_poll_options', 'advice_poll_votes', 'advice_replies', 'advice_reply_ratings', 'advice_post_reactions', 'advice_followers', 'advice_updates'];
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
