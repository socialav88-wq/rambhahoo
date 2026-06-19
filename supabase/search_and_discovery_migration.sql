-- =========================================================================
-- Rambhahoo Search & Discovery Engine Migration
-- =========================================================================

-- 1. Create businesses table
DROP TABLE IF EXISTS public.businesses CASCADE;

CREATE TABLE public.businesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  locality_id UUID REFERENCES public.localities(id) ON DELETE SET NULL,
  rating NUMERIC DEFAULT 4.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) on businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policy allowing public reads
DROP POLICY IF EXISTS "Allow public read of businesses" ON public.businesses;
CREATE POLICY "Allow public read of businesses" 
ON public.businesses FOR SELECT 
USING (true);

-- 4. Create Indexes for fast tag searches and category lookups
CREATE INDEX IF NOT EXISTS idx_posts_tags_gin ON public.posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_businesses_tags_gin ON public.businesses USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_businesses_locality_id ON public.businesses(locality_id);

-- 5. Seed initial businesses mapped dynamically to localities
INSERT INTO public.businesses (name, slug, description, category, tags, image_url, locality_id, rating) VALUES
(
  'Cafe Niloufer',
  'cafe-niloufer-madhapur',
  'Legendary Hyderabadi tea, bun maska, and premium bakery items.',
  'Cafe',
  '{"tea", "niloufer", "cafe", "bun maska", "bakery"}',
  'https://vtszkowjjwkdxxgufgie.supabase.co/storage/v1/object/public/tapri-images/niloufer.jpg',
  (SELECT id FROM public.localities WHERE slug = 'madhapur' LIMIT 1),
  4.7
),
(
  'Roastery Coffee House',
  'roastery-coffee-house-banjara-hills',
  'Premium specialty coffee, beautiful outdoor seating, and gourmet breakfast.',
  'Cafe',
  '{"coffee", "roastery", "cafe", "breakfast", "outdoor"}',
  'https://vtszkowjjwkdxxgufgie.supabase.co/storage/v1/object/public/tapri-images/roastery.jpg',
  (SELECT id FROM public.localities WHERE slug = 'banjara-hills' LIMIT 1),
  4.6
),
(
  'Absolute Barbecues',
  'absolute-barbecues-gachibowli',
  'Famous buffet restaurant featuring live grills, delicious biryani, and desserts.',
  'Restaurant',
  '{"biryani", "barbecue", "buffet", "food", "grill"}',
  'https://vtszkowjjwkdxxgufgie.supabase.co/storage/v1/object/public/tapri-images/barbecue.jpg',
  (SELECT id FROM public.localities WHERE slug = 'gachibowli' LIMIT 1),
  4.4
),
(
  'Cult.fit Hitec City',
  'cultfit-hitec-city',
  'Group workouts, yoga, strength training, and premium gym facilities.',
  'Gym',
  '{"gym", "fitness", "workout", "health", "cult"}',
  'https://vtszkowjjwkdxxgufgie.supabase.co/storage/v1/object/public/tapri-images/cultfit.jpg',
  (SELECT id FROM public.localities WHERE slug = 'hitech-city' LIMIT 1),
  4.5
),
(
  'Over The Moon',
  'over-the-moon-jubilee-hills',
  'Rooftop microbrewery, premium draft beers, and happening nightlife.',
  'Brewery',
  '{"brewery", "beer", "nightlife", "music", "rooftop"}',
  'https://vtszkowjjwkdxxgufgie.supabase.co/storage/v1/object/public/tapri-images/brewery.jpg',
  (SELECT id FROM public.localities WHERE slug = 'jubilee-hills' LIMIT 1),
  4.3
)
ON CONFLICT (slug) DO NOTHING;

-- 6. RPC Function for Decayed Trending Posts
CREATE OR REPLACE FUNCTION public.get_trending_posts_decayed(
  p_locality_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0
)
RETURNS SETOF public.posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.posts p
  WHERE (p_locality_id IS NULL OR p.locality_id = p_locality_id)
  ORDER BY (
    p.reaction_count * 1.5 + 
    p.comment_count * 2.5 + 
    p.view_count * 0.1 + 
    COALESCE((SELECT COUNT(*)::INT FROM public.poll_votes WHERE post_id = p.id), 0) * 1.5 +
    COALESCE((SELECT COUNT(*)::INT FROM public.saved_posts WHERE post_id = p.id), 0) * 2.0
  ) / POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 + 2, 1.5) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
