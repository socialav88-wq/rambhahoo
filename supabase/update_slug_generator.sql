-- 1. Drop the old generate_slug function
DROP FUNCTION IF EXISTS public.generate_slug(TEXT);

-- 2. Create the updated, clean generate_slug function with collision checking
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Generate the clean base slug (convert spaces/special characters to dashes, lowercase)
  base_slug := left(trim(both '-' from regexp_replace(regexp_replace(lower(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g')), '\s+', '-', 'g'), '-+', '-', 'g')), 60);
  
  -- Fallback if the title has no letters/numbers
  IF base_slug = '' THEN
    base_slug := 'post';
  END IF;

  final_slug := base_slug;
  
  -- Loop and check for collisions. Only append a suffix if it already exists.
  WHILE EXISTS (SELECT 1 FROM public.posts WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 3. Temporarily disable the slug auto-generation trigger so we can update existing post slugs
ALTER TABLE public.posts DISABLE TRIGGER trigger_auto_slug;

-- 4. Temporarily set slugs to post IDs to avoid transient "duplicate key" errors during update
UPDATE public.posts SET slug = id::text;

-- 5. Regenerate all existing post slugs using the new clean generator
UPDATE public.posts SET slug = generate_slug(title);

-- 6. Re-enable the auto-generation trigger
ALTER TABLE public.posts ENABLE TRIGGER trigger_auto_slug;
