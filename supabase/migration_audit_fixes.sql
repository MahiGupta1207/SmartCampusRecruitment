-- =====================================================================
-- SMART CAMPUS RECRUITMENT SYSTEM (CampusHire)
-- Security & Functional Audit Migration (Idempotent & Non-Destructive)
-- Run this in Supabase Dashboard -> SQL Editor
-- =====================================================================

-- 1. Harden helper function is_admin() with explicit safe search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::public.user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. Harden handle_new_user() trigger:
--    - Never allow self-registration as 'admin'
--    - Safe search_path = public
--    - Resilient to malformed/out-of-range graduation_year and cgpa metadata
--    - Resilient to duplicate enrollment_no
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  enroll_no      TEXT;
  raw_grad_year  TEXT;
  raw_cgpa       TEXT;
  parsed_year    INTEGER := 2027;
  parsed_cgpa    NUMERIC(4,2) := 8.00;
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

  IF EXISTS (SELECT 1 FROM public.student_profiles WHERE enrollment_no = enroll_no) THEN
    enroll_no := enroll_no || '-' || UPPER(SUBSTRING(NEW.id::TEXT FROM 1 FOR 4));
  END IF;

  -- Safely parse graduation_year (valid range 2020..2035, fallback 2027)
  raw_grad_year := NULLIF(TRIM(NEW.raw_user_meta_data->>'graduation_year'), '');
  IF raw_grad_year IS NOT NULL THEN
    BEGIN
      parsed_year := raw_grad_year::INTEGER;
      IF parsed_year < 2020 OR parsed_year > 2035 THEN
        parsed_year := 2027;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      parsed_year := 2027;
    END;
  END IF;

  -- Safely parse cgpa (valid range 0.00..10.00, fallback 8.00)
  raw_cgpa := NULLIF(TRIM(NEW.raw_user_meta_data->>'cgpa'), '');
  IF raw_cgpa IS NOT NULL THEN
    BEGIN
      parsed_cgpa := ROUND(raw_cgpa::NUMERIC, 2);
      IF parsed_cgpa < 0.00 OR parsed_cgpa > 10.00 THEN
        parsed_cgpa := 8.00;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      parsed_cgpa := 8.00;
    END;
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
    parsed_year,
    parsed_cgpa,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- 3. Prevent non-admins from escalating their own role in public.profiles
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.prevent_role_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_prevent_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();

-- 4. Prevent students from tampering with placement status fields
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.prevent_student_placement_tampering() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_prevent_student_placement_tampering ON public.student_profiles;
CREATE TRIGGER trg_prevent_student_placement_tampering
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_student_placement_tampering();

-- 5. Validate application ownership, job status/deadline, and eligibility before INSERT
CREATE OR REPLACE FUNCTION public.validate_job_application()
RETURNS TRIGGER AS $$
DECLARE
  v_job             RECORD;
  v_elig            RECORD;
  v_student         RECORD;
  v_min_cgpa        NUMERIC(4,2) := 7.00;
  v_max_backlogs    INTEGER := 0;
  v_allowed_branches TEXT[] := ARRAY['Computer Science & Engineering', 'Information Technology'];
  v_allowed_batches  INTEGER[] := ARRAY[2026, 2027];
BEGIN
  -- Enforce ownership: non-admins can only apply as themselves
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() AND NEW.student_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'You can only submit applications for yourself';
  END IF;

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
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student profile not found. Please complete your profile first.';
  END IF;

  -- Load job_eligibility; if missing, enforce the application default criteria (fail-closed)
  SELECT * INTO v_elig FROM public.job_eligibility WHERE job_id = NEW.job_id;
  IF FOUND THEN
    v_min_cgpa := v_elig.min_cgpa;
    v_max_backlogs := v_elig.max_backlogs;
    v_allowed_branches := COALESCE(v_elig.allowed_branches, '{}');
    v_allowed_batches := COALESCE(v_elig.allowed_batches, '{}');
  END IF;

  IF v_student.cgpa < v_min_cgpa THEN
    RAISE EXCEPTION 'Minimum CGPA requirement (%) not met', v_min_cgpa;
  END IF;

  IF v_student.backlogs > v_max_backlogs THEN
    RAISE EXCEPTION 'Maximum allowed backlogs (%) exceeded', v_max_backlogs;
  END IF;

  IF COALESCE(array_length(v_allowed_branches, 1), 0) > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM unnest(v_allowed_branches) AS b
      WHERE LOWER(TRIM(b)) = LOWER(TRIM(v_student.branch))
    ) THEN
      RAISE EXCEPTION 'Your branch (%) is not eligible for this drive', v_student.branch;
    END IF;
  END IF;

  IF COALESCE(array_length(v_allowed_batches, 1), 0) > 0 THEN
    IF NOT (v_student.graduation_year = ANY(v_allowed_batches)) THEN
      RAISE EXCEPTION 'Your graduation batch (%) is not eligible for this drive', v_student.graduation_year;
    END IF;
  END IF;

  -- Force initial status to 'Applied' for student-submitted applications
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.status := 'Applied'::public.application_status_enum;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.validate_job_application() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_validate_job_application ON public.applications;
CREATE TRIGGER trg_validate_job_application
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.validate_job_application();

-- 6. Automatically record initial 'Applied' status in application_status_history
CREATE OR REPLACE FUNCTION public.log_initial_application_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.application_status_history (application_id, status, notes, updated_by)
  VALUES (NEW.id, NEW.status, COALESCE(NEW.notes, 'Application submitted.'), NEW.student_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.log_initial_application_status() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_log_initial_application_status ON public.applications;
CREATE TRIGGER trg_log_initial_application_status
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.log_initial_application_status();

-- 7. Cleanly replace ALL existing RLS policies on core tables (prevents legacy permissive bypasses)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles',
        'student_profiles',
        'jobs',
        'job_eligibility',
        'applications',
        'application_status_history'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

-- PROFILES: users view/update only their own row; admins view/update all
CREATE POLICY "Users view own profile or admins view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users update own profile or admins update all"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- STUDENT PROFILES: students view/insert/update only their own row; admins manage all
CREATE POLICY "Students view own profile or admins view all"
  ON public.student_profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Students insert own profile or admins insert"
  ON public.student_profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Students update own profile or admins update all"
  ON public.student_profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- JOBS: authenticated users view active jobs (or jobs they applied to); admins manage all
CREATE POLICY "Authenticated users view active jobs or admins view all"
  ON public.jobs FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      is_active = TRUE
      OR public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.job_id = id AND a.student_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins insert jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins update jobs"
  ON public.jobs FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete jobs"
  ON public.jobs FOR DELETE
  USING (public.is_admin());

-- JOB ELIGIBILITY: authenticated users view; admins manage
CREATE POLICY "Authenticated users view job eligibility"
  ON public.job_eligibility FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins insert job eligibility"
  ON public.job_eligibility FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins update job eligibility"
  ON public.job_eligibility FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete job eligibility"
  ON public.job_eligibility FOR DELETE
  USING (public.is_admin());

-- APPLICATIONS: students see own & apply only as themselves; admins manage all
CREATE POLICY "Students see own applications or admins see all"
  ON public.applications FOR SELECT
  USING (auth.uid() = student_id OR public.is_admin());

CREATE POLICY "Students apply only as themselves"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = student_id);

CREATE POLICY "Admins update applications"
  ON public.applications FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete applications"
  ON public.applications FOR DELETE
  USING (public.is_admin());

-- APPLICATION STATUS HISTORY: students see own history; only admins insert/update/delete
CREATE POLICY "Students see own status history or admins see all"
  ON public.application_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND (a.student_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Admins insert status history"
  ON public.application_status_history FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins update status history"
  ON public.application_status_history FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete status history"
  ON public.application_status_history FOR DELETE
  USING (public.is_admin());

-- 8. RESUME PRIVACY: Private 'resumes' bucket + owner/admin-only access policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Drop any existing storage.objects policies targeting 'resumes' or 'avatars'
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        COALESCE(qual::text, '') ILIKE '%resumes%'
        OR COALESCE(with_check::text, '') ILIKE '%resumes%'
        OR COALESCE(qual::text, '') ILIKE '%avatars%'
        OR COALESCE(with_check::text, '') ILIKE '%avatars%'
        OR policyname IN (
          'Public Read Access for Resumes',
          'Authenticated users can upload resumes',
          'Users can upload their own resumes',
          'Users can update their own resumes',
          'Users can delete their own resumes',
          'Owners and admins can view resumes',
          'Public Read Access for Avatars',
          'Users can upload their own avatars',
          'Users can update their own avatars',
          'Users can delete their own avatars'
        )
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Owners and admins can view resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

CREATE POLICY "Users can update their own resumes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resumes' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  )
  WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

CREATE POLICY "Users can delete their own resumes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- 9. Profile pictures ('avatars' bucket with owner folder isolation)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Access for Avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- 10. Backfill any existing auth.users missing a profile or student_profile row
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
