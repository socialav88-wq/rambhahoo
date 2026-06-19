-- 1. Self-follow prevention check constraint on followers table
ALTER TABLE public.followers ADD CONSTRAINT check_not_self_follow CHECK (follower_id <> following_id);

-- 2. Add is_admin column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 3. Add content column to notifications table for storing reactions/reasons
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS content TEXT;

-- 4. Drop old notifications check constraint and apply the new set of notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS check_notification_type;

ALTER TABLE public.notifications ADD CONSTRAINT check_notification_type 
  CHECK (type IN ('POST_LIKE', 'POST_REACTION', 'POST_COMMENT', 'POLL_VOTE', 'CIRCLE_ADD', 'MENTION', 'COMMENT_REPLY', 'POST_REPORT', 'SYSTEM'));

-- 5. Row Level Security: Allow authenticated users to insert notifications
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications 
  FOR INSERT WITH CHECK (auth.uid() = actor_id);
