-- Add joined_locality_ids to public.profiles table to track all joined localities
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS joined_locality_ids UUID[] DEFAULT '{}';

-- Initialize existing profiles with their current locality_id
UPDATE public.profiles 
SET joined_locality_ids = ARRAY[locality_id] 
WHERE locality_id IS NOT NULL AND (joined_locality_ids IS NULL OR cardinality(joined_locality_ids) = 0);
