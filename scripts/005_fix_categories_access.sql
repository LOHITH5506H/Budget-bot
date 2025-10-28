-- Fix categories table to allow public read access
-- Categories should be readable by all authenticated users

-- Enable RLS on categories if not already enabled
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;

-- Allow all authenticated users to read categories
CREATE POLICY "categories_select_all" 
ON public.categories 
FOR SELECT 
TO authenticated 
USING (true);

-- Optionally, allow read access to anonymous users as well
-- CREATE POLICY "categories_select_anon" 
-- ON public.categories 
-- FOR SELECT 
-- TO anon 
-- USING (true);
