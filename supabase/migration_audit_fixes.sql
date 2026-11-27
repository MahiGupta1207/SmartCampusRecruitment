-- =====================================================================
-- SMART CAMPUS RECRUITMENT SYSTEM (CampusHire)
-- Security & Functional Audit Migration (Idempotent)
-- Run this in Supabase Dashboard -> SQL Editor
-- =====================================================================

-- 1. Harden handle_new_user() trigger: NEVER allow self-registration as 'admin'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  enroll_no      TEXT;
BEGIN
  user_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );

  -- Always default to 'student'; admin accounts must be promoted via Supabase SQL Editor
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, user_full_name, 'student'::public.user_role)
  ON CONFLICT DO NOTHING;

  enroll_no := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'enrollment_no'), ''),
    'AUTO-' || UPPER(SUBSTRING(NEW.id::TEXT FROM 1 FOR 8))
  );

  -- Prevent unique_violation crash if enrollment_no already exists
  IF EXISTS (SELECT 1 FROM public.student_profiles WHERE enrollment_no = enroll_no) THEN
    enroll_no := enroll_no || '-' || UPPER(SUBSTRING(NEW.id::TEXT FROM 1 FOR 4));
  END IF;

  INSERT INTO public.student_profiles (
    id,
    enrollment_no,
    branch,
    graduation_year,
    cgpa,
    backlogs
  ) VALUES (
    NEW.id,
    enroll_no,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'branch'), ''), 'Computer Science & Engineering'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'graduation_year', '')::INTEGER, 2027),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'cgpa', '')::NUMERIC, 8.00),
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Prevent non-admins from escalating their own role in public.profiles
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only administrators can modify user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();

-- 3. Prevent students from tampering with placement status fields
CREATE OR REPLACE FUNCTION public.prevent_student_placement_tampering()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    NEW.is_placed IS DISTINCT FROM OLD.is_placed OR
    NEW.current_company IS DISTINCT FROM OLD.current_company OR
    NEW.package_lpa IS DISTINCT FROM OLD.package_lpa
  ) THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only administrators can modify placement status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_student_placement_tampering ON public.student_profiles;
CREATE TRIGGER trg_prevent_student_placement_tampering
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_student_placement_tampering();

-- 4. Validate job is active, not expired, and student meets eligibility before INSERT into applications
CREATE OR REPLACE FUNCTION public.validate_job_application()
RETURNS TRIGGER AS $$
DECLARE
  v_job RECORD;
  v_elig RECORD;
  v_student RECORD;
BEGIN
  SELECT id, is_active, deadline INTO v_job
  FROM public.jobs
  WHERE id = NEW.job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job drive not found';
  END IF;

  IF NOT v_job.is_active THEN
    RAISE EXCEPTION 'This job drive is closed/inactive';
  END IF;

  IF v_job.deadline < NOW() THEN
    RAISE EXCEPTION 'Application deadline has passed';
  END IF;

  SELECT * INTO v_student FROM public.student_profiles WHERE id = NEW.student_id;
  SELECT * INTO v_elig FROM public.job_eligibility WHERE job_id = NEW.job_id;

  IF FOUND AND v_student.id IS NOT NULL THEN
    IF v_student.cgpa < v_elig.min_cgpa THEN
      RAISE EXCEPTION 'Minimum CGPA requirement (%) not met', v_elig.min_cgpa;
    END IF;
    IF v_student.backlogs > v_elig.max_backlogs THEN
      RAISE EXCEPTION 'Maximum allowed backlogs (%) exceeded', v_elig.max_backlogs;
    END IF;
  END IF;

  -- Force initial status to 'Applied' for student-submitted applications
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.status := 'Applied'::application_status_enum;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_validate_job_application ON public.applications;
CREATE TRIGGER trg_validate_job_application
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.validate_job_application();

-- 5. Automatically record initial 'Applied' status in application_status_history
CREATE OR REPLACE FUNCTION public.log_initial_application_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.application_status_history (application_id, status, notes, updated_by)
  VALUES (NEW.id, NEW.status, COALESCE(NEW.notes, 'Application submitted.'), NEW.student_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_initial_application_status ON public.applications;
CREATE TRIGGER trg_log_initial_application_status
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.log_initial_application_status();

-- 6. Tighten Storage Policies for 'resumes' bucket (owner folder isolation)
DROP POLICY IF EXISTS "Public Read Access for Resumes" ON storage.objects;
CREATE POLICY "Public Read Access for Resumes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes');

DROP POLICY IF EXISTS "Authenticated users can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "Users can update their own resumes" ON storage.objects;
CREATE POLICY "Users can update their own resumes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resumes' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;
CREATE POLICY "Users can delete their own resumes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- 7. Profile pictures ('avatars' bucket with owner folder isolation)
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

-- 8. Backfill any existing auth.users missing a profile or student_profile row
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1)),
  'student'::public.user_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT DO NOTHING;

INSERT INTO public.student_profiles (id, enrollment_no, branch, graduation_year, cgpa, backlogs)
SELECT
  p.id,
  'AUTO-' || UPPER(SUBSTRING(p.id::TEXT FROM 1 FOR 8)),
  'Computer Science & Engineering',
  2027,
  8.00,
  0
FROM public.profiles p
WHERE p.role = 'student'::public.user_role
  AND NOT EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = p.id)
ON CONFLICT DO NOTHING;
