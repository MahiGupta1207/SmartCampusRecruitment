-- =====================================================================
-- SUPABASE STORAGE CONFIGURATION: RESUMES BUCKET
-- Run this in Supabase SQL Editor if creating the bucket via SQL
-- =====================================================================

-- 1. Create the 'resumes' storage bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for 'resumes' bucket
-- Allow public download/view of uploaded resumes
CREATE POLICY "Public Read Access for Resumes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes');

-- Allow authenticated students to upload their resumes
CREATE POLICY "Authenticated users can upload resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' AND
    auth.role() = 'authenticated'
  );

-- Allow students to update/overwrite their own resumes
CREATE POLICY "Users can update their own resumes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resumes' AND
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own resumes
CREATE POLICY "Users can delete their own resumes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes' AND
    auth.role() = 'authenticated'
  );
