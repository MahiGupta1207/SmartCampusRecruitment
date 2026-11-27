-- =====================================================================
-- SMART CAMPUS RECRUITMENT SYSTEM (CampusHire)
-- Complete Production Database Schema & Row Level Security (RLS)
-- Idempotent: Safe to run multiple times without duplicate errors
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE job_type_enum AS ENUM ('Full-time', 'Internship', 'Intern + PPO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status_enum AS ENUM (
    'Applied',
    'Under Review',
    'Shortlisted',
    'Interview Scheduled',
    'Selected',
    'Rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'student'::user_role NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. STUDENT PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_no TEXT UNIQUE,
  phone TEXT,
  branch TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
  graduation_year INTEGER NOT NULL DEFAULT 2027,
  cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
  backlogs INTEGER NOT NULL DEFAULT 0 CHECK (backlogs >= 0),
  resume_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  bio TEXT,
  is_placed BOOLEAN DEFAULT FALSE NOT NULL,
  current_company TEXT,
  package_lpa NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. STUDENT SKILLS TABLE
CREATE TABLE IF NOT EXISTS public.student_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(student_id, skill_name)
);

-- 6. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website TEXT,
  industry TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  role_category TEXT NOT NULL,
  job_type job_type_enum NOT NULL DEFAULT 'Full-time',
  location TEXT NOT NULL,
  salary_min_lpa NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  salary_max_lpa NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  stipend_monthly NUMERIC(10,2),
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  selection_process TEXT[] DEFAULT '{}',
  deadline TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. JOB ELIGIBILITY TABLE
CREATE TABLE IF NOT EXISTS public.job_eligibility (
  job_id UUID PRIMARY KEY REFERENCES public.jobs(id) ON DELETE CASCADE,
  min_cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00,
  max_backlogs INTEGER NOT NULL DEFAULT 0,
  allowed_branches TEXT[] NOT NULL DEFAULT '{}',
  allowed_batches INTEGER[] NOT NULL DEFAULT '{}',
  required_skills TEXT[] DEFAULT '{}'
);

-- 9. APPLICATIONS TABLE (Strict unique constraint prevents duplicate applications)
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  status application_status_enum NOT NULL DEFAULT 'Applied',
  applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT,
  interview_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(job_id, student_id)
);

-- 10. APPLICATION STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.application_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  status application_status_enum NOT NULL,
  notes TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_student_profiles_branch ON public.student_profiles(branch);
CREATE INDEX IF NOT EXISTS idx_student_profiles_cgpa ON public.student_profiles(cgpa);
CREATE INDEX IF NOT EXISTS idx_student_profiles_placed ON public.student_profiles(is_placed);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON public.jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON public.jobs(deadline);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current authenticated user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view all basic profiles" ON public.profiles;
CREATE POLICY "Users can view all basic profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- STUDENT PROFILES POLICIES
DROP POLICY IF EXISTS "Students can view their own profile or admins view all" ON public.student_profiles;
CREATE POLICY "Students can view their own profile or admins view all"
  ON public.student_profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Students can update own profile" ON public.student_profiles;
CREATE POLICY "Students can update own profile"
  ON public.student_profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Students can insert own student profile" ON public.student_profiles;
CREATE POLICY "Students can insert own student profile"
  ON public.student_profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- STUDENT SKILLS POLICIES
DROP POLICY IF EXISTS "Students or admins can view skills" ON public.student_skills;
CREATE POLICY "Students or admins can view skills"
  ON public.student_skills FOR SELECT
  USING (auth.uid() = student_id OR public.is_admin());

DROP POLICY IF EXISTS "Students can manage own skills" ON public.student_skills;
CREATE POLICY "Students can manage own skills"
  ON public.student_skills FOR ALL
  USING (auth.uid() = student_id OR public.is_admin());

-- COMPANIES POLICIES
DROP POLICY IF EXISTS "Anyone logged in can view companies" ON public.companies;
CREATE POLICY "Anyone logged in can view companies"
  ON public.companies FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Only admins can insert companies" ON public.companies;
CREATE POLICY "Only admins can insert companies"
  ON public.companies FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can update companies" ON public.companies;
CREATE POLICY "Only admins can update companies"
  ON public.companies FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can delete companies" ON public.companies;
CREATE POLICY "Only admins can delete companies"
  ON public.companies FOR DELETE
  USING (public.is_admin());

-- JOBS & ELIGIBILITY POLICIES
DROP POLICY IF EXISTS "Authenticated users can view active jobs" ON public.jobs;
CREATE POLICY "Authenticated users can view active jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage jobs" ON public.jobs;
CREATE POLICY "Admins can manage jobs"
  ON public.jobs FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can view job eligibility" ON public.job_eligibility;
CREATE POLICY "Authenticated users can view job eligibility"
  ON public.job_eligibility FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage job eligibility" ON public.job_eligibility;
CREATE POLICY "Admins can manage job eligibility"
  ON public.job_eligibility FOR ALL
  USING (public.is_admin());

-- APPLICATIONS POLICIES
DROP POLICY IF EXISTS "Students see own applications, admins see all" ON public.applications;
CREATE POLICY "Students see own applications, admins see all"
  ON public.applications FOR SELECT
  USING (auth.uid() = student_id OR public.is_admin());

DROP POLICY IF EXISTS "Students can apply only as themselves" ON public.applications;
CREATE POLICY "Students can apply only as themselves"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can update application status" ON public.applications;
CREATE POLICY "Admins can update application status"
  ON public.applications FOR UPDATE
  USING (public.is_admin());

-- APPLICATION HISTORY POLICIES
DROP POLICY IF EXISTS "Students see own history, admins see all" ON public.application_status_history;
CREATE POLICY "Students see own history, admins see all"
  ON public.application_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND (a.student_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admins can insert status history" ON public.application_status_history;
CREATE POLICY "Admins can insert status history"
  ON public.application_status_history FOR INSERT
  WITH CHECK (public.is_admin());

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Users can view and manage their own notifications" ON public.notifications;
CREATE POLICY "Users can view and manage their own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================================
-- TRIGGER: Automatically create profile on auth.users registration
-- =====================================================================
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

  -- Use provided enrollment_no; fall back to a unique UUID-based value
  enroll_no := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'enrollment_no'), ''),
    'AUTO-' || UPPER(SUBSTRING(NEW.id::TEXT FROM 1 FOR 8))
  );

  IF EXISTS (SELECT 1 FROM public.student_profiles WHERE enrollment_no = enroll_no) THEN
    enroll_no := enroll_no || '-' || UPPER(SUBSTRING(NEW.id::TEXT FROM 1 FOR 4));
  END IF;

  -- Safe insert: skip if the student_profile row already exists
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
