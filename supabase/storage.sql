-- =====================================================================
-- SUPABASE STORAGE CONFIGURATION: RESUMES BUCKET
-- Run this in Supabase SQL Editor if creating the bucket via SQL
-- =====================================================================

-- 1. Create the 'resumes' storage bucket as PRIVATE (owner & admin access only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Storage Policies for 'resumes' bucket (owner-scoped folders)
DROP POLICY IF EXISTS "Public Read Access for Resumes" ON storage.objects;
DROP POLICY IF EXISTS "Owners and admins can view resumes" ON storage.objects;
CREATE POLICY "Owners and admins can view resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- Allow authenticated students to upload resumes only to their own <uid>/ folder (or admins)
DROP POLICY IF EXISTS "Authenticated users can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- Allow students to update/overwrite only their own resumes (or admins)
DROP POLICY IF EXISTS "Users can update their own resumes" ON storage.objects;
CREATE POLICY "Users can update their own resumes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resumes' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- Allow users to delete only their own resumes (or admins)
DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;
CREATE POLICY "Users can delete their own resumes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- 3. Create the 'avatars' storage bucket for student profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Access for Avatars" ON storage.objects;
CREATE POLICY "Public Read Access for Avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );
