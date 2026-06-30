-- =======================================================
-- 1. CREATE RAMBHAHOO MEDIA STORAGE BUCKET
-- =======================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('RAMBHAHOO', 'RAMBHAHOO', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop policies if they already exist to avoid name conflicts
DROP POLICY IF EXISTS "Public access to RAMBHAHOO" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to RAMBHAHOO" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own files in RAMBHAHOO" ON storage.objects;

-- Allow public read access to all files in RAMBHAHOO
CREATE POLICY "Public access to RAMBHAHOO" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'RAMBHAHOO');

-- Allow authenticated users to upload files to their own folder in RAMBHAHOO
CREATE POLICY "Users can upload to RAMBHAHOO" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'RAMBHAHOO' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to edit or delete their own uploaded files
CREATE POLICY "Users can manage own files in RAMBHAHOO" 
ON storage.objects FOR ALL 
USING (
  bucket_id = 'RAMBHAHOO' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =======================================================
-- 2. ADD VIDEO SUPPORT TO POSTS TABLE
-- =======================================================
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_metadata JSONB DEFAULT '{}'::jsonb;
