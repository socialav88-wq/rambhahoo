-- =======================================================
-- FIX COMMENTS & STORAGE UPLOADS
-- =======================================================

-- 1. FIX COMMENTS
-- Ensures any logged-in user can insert a comment as long as it's tied to their user_id
DROP POLICY IF EXISTS "Allow authenticated users to insert comments" ON public.comments;
CREATE POLICY "Allow authenticated users to insert comments" ON public.comments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete their own comments" ON public.comments;
CREATE POLICY "Allow users to delete their own comments" ON public.comments
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. FIX STORAGE UPLOADS (AVATARS & POST IMAGES)
-- Ensures users can only upload into a folder named with their user ID (e.g., user-id/avatars/img.jpg)
DROP POLICY IF EXISTS "Allow users to upload files to their own folder" ON storage.objects;
CREATE POLICY "Allow users to upload files to their own folder" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'RAMBHAHOO' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
CREATE POLICY "Allow users to update their own files" ON storage.objects
FOR UPDATE TO authenticated WITH CHECK (
  bucket_id = 'RAMBHAHOO' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
