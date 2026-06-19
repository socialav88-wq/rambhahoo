-- ====================================================================
-- RAMBHAHOO PROFILE PICTURE BACKFILL MIGRATION
-- ====================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard.
-- 2. Go to the SQL Editor in the left sidebar.
-- 3. Click "New Query".
-- 4. Paste the entire content of this script and click "Run".
-- ====================================================================

-- 1. Update existing profiles that are missing avatar_url
-- but have picture or avatar_url stored in auth.users.raw_user_meta_data
UPDATE public.profiles p
SET avatar_url = COALESCE(
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'picture',
  p.avatar_url
)
FROM auth.users u
WHERE p.id = u.id 
  AND (p.avatar_url IS NULL OR p.avatar_url = '');

-- 2. Update the handle_new_user() function to automatically
-- extract 'picture' (Google/OAuth profile pic) or 'avatar_url' on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
