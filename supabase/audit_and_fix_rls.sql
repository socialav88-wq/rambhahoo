-- =========================================================================
-- tapri-images - PRODUCTION STABILITY & SOCIAL PLATFORM AUDIT MIGRATION
-- =========================================================================

-- 1. Re-create Check Constraint for Notification Types (include EVENT_RSVP)
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS check_notification_type;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT check_notification_type 
  CHECK (type IN ('POST_LIKE', 'POST_REACTION', 'POST_COMMENT', 'POLL_VOTE', 'CIRCLE_ADD', 'MENTION', 'COMMENT_REPLY', 'POST_REPORT', 'SYSTEM', 'EVENT_RSVP', 'rsvp'));

-- 2. Ensure Storage Bucket tapri-images exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tapri-images', 'tapri-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for tapri-images Bucket
DROP POLICY IF EXISTS "Public Access tapri-images" ON storage.objects;
CREATE POLICY "Public Access tapri-images" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'tapri-images' );

DROP POLICY IF EXISTS "Authenticated users can upload tapri-images" ON storage.objects;
CREATE POLICY "Authenticated users can upload tapri-images" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'tapri-images' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can update own tapri-images" ON storage.objects;
CREATE POLICY "Users can update own tapri-images" 
ON storage.objects FOR UPDATE 
USING ( auth.uid() = owner ) WITH CHECK ( bucket_id = 'tapri-images' );

DROP POLICY IF EXISTS "Users can delete own tapri-images" ON storage.objects;
CREATE POLICY "Users can delete own tapri-images" 
ON storage.objects FOR DELETE 
USING ( auth.uid() = owner AND bucket_id = 'tapri-images' );

-- 4. Audit RLS Policies for Saved Posts, Reports, messages, push_subscriptions
-- Enable RLS
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Saved Posts Policies
DROP POLICY IF EXISTS "Users can view own saved posts" ON public.saved_posts;
CREATE POLICY "Users can view own saved posts" ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved posts" ON public.saved_posts;
CREATE POLICY "Users can insert own saved posts" ON public.saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved posts" ON public.saved_posts;
CREATE POLICY "Users can delete own saved posts" ON public.saved_posts FOR DELETE USING (auth.uid() = user_id);

-- Reports Policies
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);

-- Check policy for insert on reports
DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Push Subscriptions Policies
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Messages Policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 5. Add Tables to Supabase Realtime Publication
-- Drop publication table registrations if already present, and add them
DO $$
BEGIN
  -- We add tables dynamically to supabase_realtime publication
  -- Realtime server will listen to these tables
  ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION WHEN OTHERS THEN
  -- Already added or publication issues
END; $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
EXCEPTION WHEN OTHERS THEN
END; $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
EXCEPTION WHEN OTHERS THEN
END; $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
EXCEPTION WHEN OTHERS THEN
END; $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN OTHERS THEN
END; $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN
END; $$;

-- 6. Programmatic Test User Confirmation Helper
-- Confirm email for any rambhahoo test users to make automated testing seamless
UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email LIKE 'rambhahoo.test.%';
