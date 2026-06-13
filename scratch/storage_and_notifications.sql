-- =======================================================
-- 1. FIX STORAGE UPLOADS (IMAGES & AVATARS)
-- =======================================================

-- Create the RAMBHAHOO bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('RAMBHAHOO', 'RAMBHAHOO', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies just in case
DROP POLICY IF EXISTS "Public access to RAMBHAHOO" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to RAMBHAHOO" ON storage.objects;

-- Allow public read access to all files in RAMBHAHOO
CREATE POLICY "Public access to RAMBHAHOO" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'RAMBHAHOO');

-- Allow authenticated users to upload files to RAMBHAHOO
CREATE POLICY "Users can upload to RAMBHAHOO" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'RAMBHAHOO' AND 
  auth.uid()::text = (storage.foldername(name))[1] -- Ensures users can only upload to their own folder
);

-- Allow authenticated users to update/delete their own files
CREATE POLICY "Users can manage their files in RAMBHAHOO" 
ON storage.objects FOR ALL 
USING (
  bucket_id = 'RAMBHAHOO' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =======================================================
-- 2. NOTIFICATIONS SYSTEM
-- =======================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- Who receives the notification
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,       -- Who caused the notification
  type VARCHAR(50) NOT NULL,                                       -- 'circle', 'comment', 'reaction', 'poll'
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- TRIGGER: Notify when someone adds you to their circle
CREATE OR REPLACE FUNCTION notify_on_circle()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.follower_id != NEW.following_id THEN
    INSERT INTO notifications (user_id, sender_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'circle');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_circle ON followers;
CREATE TRIGGER trigger_notify_on_circle
AFTER INSERT ON followers
FOR EACH ROW EXECUTE FUNCTION notify_on_circle();

-- TRIGGER: Notify when someone comments on your post
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get the owner of the post
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- If the commenter is not the post owner, notify the owner
  IF NEW.user_id != post_owner_id THEN
    INSERT INTO notifications (user_id, sender_id, type, post_id, comment_id)
    VALUES (post_owner_id, NEW.user_id, 'comment', NEW.post_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_comment ON comments;
CREATE TRIGGER trigger_notify_on_comment
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION notify_on_comment();
