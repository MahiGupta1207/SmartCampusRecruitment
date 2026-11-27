-- =====================================================================
-- SMART CAMPUS RECRUITMENT SYSTEM (CampusHire)
-- Realistic Demo / Sample Data
-- Safe to run multiple times (all inserts use ON CONFLICT DO NOTHING)
-- Does NOT touch auth.users — only public.* tables
-- Run AFTER schema.sql and migration_audit_fixes.sql
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 1 · COMPANIES
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO public.companies (id, name, logo_url, website, industry, description, location, contact_email)
VALUES
  ('c1111111-1111-1111-1111-111111111111',
   'Google India',
   'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&h=128&fit=crop&crop=faces',
   'https://careers.google.com',
   'Software & Cloud Services',
   'Google is a global technology leader focusing on search, cloud computing, AI, and advertising technologies.',
   'Bangalore / Hyderabad',
   'university-recruiting@google.com'),

  ('c2222222-2222-2222-2222-222222222222',
   'Microsoft IDC',
   'https://images.unsplash.com/photo-1642132652075-2bfa3e8784d8?w=128&h=128&fit=crop&crop=faces',
   'https://careers.microsoft.com',
   'Enterprise Software & AI',
   'Microsoft India Development Center is one of Microsoft''s largest R&D centers outside Redmond.',
   'Hyderabad / Noida / Bangalore',
   'campus-india@microsoft.com'),

  ('c3333333-3333-3333-3333-333333333333',
   'Amazon Web Services',
   'https://images.unsplash.com/photo-1523474255658-4af61825044d?w=128&h=128&fit=crop&crop=faces',
   'https://amazon.jobs',
   'Cloud Infrastructure & E-Commerce',
   'AWS provides on-demand cloud computing platforms and APIs globally.',
   'Bangalore / Chennai / Hyderabad',
   'aws-campus-hire@amazon.com'),

  ('c4444444-4444-4444-4444-444444444444',
   'Cisco Systems',
   'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&h=128&fit=crop&crop=faces',
   'https://jobs.cisco.com',
   'Networking & Cybersecurity',
   'Cisco shapes the future of the Internet through secure networking hardware and cloud software.',
   'Bangalore, India',
   'india-gradrecruitment@cisco.com'),

  ('c5555555-5555-5555-5555-555555555555',
   'Zomato & Blinkit',
   'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=128&h=128&fit=crop&crop=faces',
   'https://zomato.com/careers',
   'Food Delivery & Quick Commerce',
   'Pioneering consumer internet company transforming hyper-local logistics.',
   'Gurugram / Hybrid',
   'campus@zomato.com'),

  ('c6666666-6666-6666-6666-666666666666',
   'TCS Digital',
   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&h=128&fit=crop&crop=faces',
   'https://tcs.com/careers',
   'IT Services & Consulting',
   'TCS Digital focuses on advanced technical roles in Big Data, AI, and Full-Stack.',
   'Pan India',
   'digital.campus@tcs.com'),

  ('c7777777-7777-7777-7777-777777777777',
   'Infosys InfyTQ',
   'https://images.unsplash.com/photo-1497366216548-37526070297c?w=128&h=128&fit=crop&crop=faces',
   'https://infosys.com/careers',
   'IT Services & Digital Transformation',
   'Infosys is a global leader in next-generation digital services and consulting.',
   'Bangalore / Pune / Chennai',
   'campus@infosys.com'),

  ('c8888888-8888-8888-8888-888888888888',
   'Deloitte USI',
   'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=128&h=128&fit=crop&crop=faces',
   'https://deloitte.com/in/en/careers',
   'Management Consulting & Technology',
   'Deloitte provides world-class audit, consulting, tax, and financial advisory services.',
   'Mumbai / Hyderabad / Bangalore',
   'campus.usi@deloitte.com')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 2 · JOB DRIVES
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO public.jobs (
  id, company_id, title, role_category, job_type,
  location, salary_min_lpa, salary_max_lpa, stipend_monthly,
  description, requirements, selection_process, deadline, is_active
) VALUES

  -- Google · SDE-1 (Active)
  ('a1111111-1111-1111-1111-111111111111',
   'c1111111-1111-1111-1111-111111111111',
   'Software Development Engineer - 1',
   'Software Engineering', 'Full-time',
   'Bangalore, India', 32, 42, NULL,
   'Design and implement distributed, high-throughput cloud systems. Work with world-class engineers to build products used by billions of users.',
   ARRAY['Data Structures & Algorithms', 'C++ or Java or Python', 'System Design fundamentals', 'OS and Networks basics'],
   ARRAY['Online Coding Assessment (90 mins)', 'Technical Round 1 (DSA)', 'Technical Round 2 (System Design)', 'Googleyness & Leadership Round'],
   NOW() + INTERVAL '18 days', TRUE),

  -- Microsoft · Cloud Architect (Active)
  ('a2222222-2222-2222-2222-222222222222',
   'c2222222-2222-2222-2222-222222222222',
   'Associate Cloud Solution Architect',
   'Cloud & DevOps', 'Full-time',
   'Hyderabad, India', 24, 30, NULL,
   'Partner with enterprises on Azure architecture, microservices, and containerisation. Drive technical pre-sales and architecture advisory.',
   ARRAY['Cloud architecture basics', 'Scripting (Python/Bash)', 'Azure or AWS fundamentals', 'Client communication'],
   ARRAY['Aptitude & Technical MCQ', 'Cloud Scenario Hands-on', 'Techno-Managerial Round', 'HR Discussion'],
   NOW() + INTERVAL '23 days', TRUE),

  -- Amazon · SDE Intern + PPO (Active)
  ('a3333333-3333-3333-3333-333333333333',
   'c3333333-3333-3333-3333-333333333333',
   'Software Development Engineer Intern (PPO)',
   'Software Engineering', 'Intern + PPO',
   'Bangalore, India', 28, 35, 80000,
   '6-month intensive summer internship with direct Full-Time SDE conversion. Work on live customer-facing systems at massive scale.',
   ARRAY['Java / C++', 'Object-Oriented Design', 'Problem Solving', 'SQL basics'],
   ARRAY['Amazon OA (2 DSA Problems + Debugging)', 'Technical Interview 1 (Coding)', 'Leadership Principles Interview'],
   NOW() + INTERVAL '13 days', TRUE),

  -- Cisco · Cybersecurity (Active)
  ('a4444444-4444-4444-4444-444444444444',
   'c4444444-4444-4444-4444-444444444444',
   'Cybersecurity & Network Engineer',
   'Cybersecurity', 'Full-time',
   'Bangalore, India', 16, 22, NULL,
   'Develop automated security telemetry and threat prevention tools. Build ML-based anomaly detection for network traffic at scale.',
   ARRAY['TCP/IP & Routing Protocols', 'Network Security', 'Python scripting', 'Linux administration'],
   ARRAY['Cisco Networking Assessment (60 mins)', 'Technical Deep Dive', 'Security Case Study Presentation'],
   NOW() + INTERVAL '31 days', TRUE),

  -- Zomato · Frontend (Active)
  ('a5555555-5555-5555-5555-555555555555',
   'c5555555-5555-5555-5555-555555555555',
   'Product Engineer – Frontend',
   'Frontend Engineering', 'Full-time',
   'Gurugram / Hybrid', 18, 26, NULL,
   'Build fast, responsive consumer interfaces used by 100 million+ users. Own features end-to-end using React, TypeScript, and Tailwind CSS.',
   ARRAY['React.js & TypeScript', 'Modern CSS & Performance optimisation', 'REST / GraphQL APIs', 'Cross-browser testing'],
   ARRAY['Machine Coding Assessment (2 hrs)', 'Architecture Deep-Dive', 'Culture Fit Interview'],
   NOW() + INTERVAL '21 days', TRUE),

  -- TCS Digital (Active)
  ('a6666666-6666-6666-6666-666666666666',
   'c6666666-6666-6666-6666-666666666666',
   'Systems & Data Analyst',
   'Data & Analytics', 'Full-time',
   'Pan India', 7.5, 9.5, NULL,
   'Modern enterprise analytics, ETL pipelines, and business dashboards for Fortune 500 clients.',
   ARRAY['SQL & Python', 'Data Visualisation (Power BI / Tableau)', 'Database Fundamentals'],
   ARRAY['TCS NQT Exam', 'Technical Interview', 'HR Interview'],
   NOW() + INTERVAL '33 days', TRUE),

  -- Infosys (Upcoming)
  ('a7777777-7777-7777-7777-777777777777',
   'c7777777-7777-7777-7777-777777777777',
   'Systems Engineer',
   'Software Engineering', 'Full-time',
   'Bangalore / Pune / Chennai', 6.5, 8.5, NULL,
   'Join Infosys InfyTQ program to build enterprise applications, digital solutions, and intelligent automation for global clients.',
   ARRAY['Core Java or Python', 'RDBMS & SQL', 'Communication skills', 'Problem Solving'],
   ARRAY['InfyTQ Online Test', 'Hackathon (optional)', 'Technical Interview', 'HR Interview'],
   NOW() + INTERVAL '45 days', TRUE),

  -- Deloitte (Closed – past deadline)
  ('a8888888-8888-8888-8888-888888888888',
   'c8888888-8888-8888-8888-888888888888',
   'Business Technology Analyst',
   'Consulting & Technology', 'Full-time',
   'Mumbai / Hyderabad', 11, 15, NULL,
   'Work at the intersection of business consulting and IT implementation. Help clients transform operations using SAP, Salesforce, and cloud-native solutions.',
   ARRAY['Analytical thinking', 'Business communication', 'Basic programming', 'Data interpretation'],
   ARRAY['Online Aptitude Test', 'Group Discussion', 'Case Study Round', 'HR Interview'],
   NOW() - INTERVAL '5 days', FALSE)

ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 3 · JOB ELIGIBILITY RULES
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO public.job_eligibility (job_id, min_cgpa, max_backlogs, allowed_branches, allowed_batches, required_skills)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 8.00, 0,
   ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication'],
   ARRAY[2026, 2027], ARRAY['Data Structures', 'Algorithms', 'Java or C++']),

  ('a2222222-2222-2222-2222-222222222222', 7.50, 0,
   ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication', 'Electrical Engineering'],
   ARRAY[2026, 2027], ARRAY['Cloud Computing', 'Azure or AWS', 'Python']),

  ('a3333333-3333-3333-3333-333333333333', 7.00, 1,
   ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication'],
   ARRAY[2026, 2027], ARRAY['Java', 'Algorithms', 'SQL']),

  ('a4444444-4444-4444-4444-444444444444', 7.00, 0,
   ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication', 'Electrical Engineering'],
   ARRAY[2026, 2027], ARRAY['TCP/IP', 'Network Security', 'Linux']),

  ('a5555555-5555-5555-5555-555555555555', 6.50, 2,
   ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication',
         'Mechanical Engineering', 'Civil Engineering'],
   ARRAY[2026, 2027], ARRAY['React', 'TypeScript', 'Tailwind CSS']),

  ('a6666666-6666-6666-6666-666666666666', 6.00, 1,
   ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication',
         'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'],
   ARRAY[2026, 2027], ARRAY['SQL', 'Python', 'Excel']),

  ('a7777777-7777-7777-7777-777777777777', 6.00, 2,
   ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication',
         'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'],
   ARRAY[2026, 2027], ARRAY['Java or Python', 'SQL', 'Communication']),

  ('a8888888-8888-8888-8888-888888888888', 6.50, 0,
   ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication',
         'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'],
   ARRAY[2026, 2027], ARRAY['Analytical Thinking', 'Communication', 'Excel'])

ON CONFLICT (job_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 4 · DEMO STUDENT PROFILES
-- NOTE: These rows are inserted into public.profiles and
-- public.student_profiles as MOCK / demo data only.
-- They are NOT linked to real auth.users rows.
-- If you want them to be real login accounts you must first create
-- the users in Supabase Auth and use the resulting UUIDs here.
-- For demonstration purposes these rows satisfy all FK constraints
-- because profiles.id references auth.users(id) ON DELETE CASCADE —
-- we insert them into a special demo section so the admin dashboard
-- shows meaningful stats.  Remove this section if you prefer clean data.
--
-- APPROACH: We use the Supabase auth admin API UUIDs if the accounts
-- exist, OR we insert them directly with known UUIDs only if no FK
-- violation occurs.  To keep this file idempotent and safe we wrap in
-- a DO block that silently skips on FK violations.
-- ─────────────────────────────────────────────────────────────────────

-- Demo profiles are only inserted when the matching auth.users UUID
-- already exists (FK constraint). The ON CONFLICT clause makes this
-- idempotent. If you haven't created these Supabase Auth users yet,
-- these inserts will silently do nothing — that's intentional.

-- Student 1 · Priya Sharma (the Demo Student account)
INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  SELECT
    id, email, 'Priya Sharma', 'student',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop'
  FROM auth.users WHERE email = 'priya.sharma@campus.edu'
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

INSERT INTO public.student_profiles (id, enrollment_no, branch, graduation_year, cgpa, backlogs, bio, linkedin_url, is_placed)
  SELECT
    p.id, '2023CS01042', 'Computer Science & Engineering', 2027, 9.15, 0,
    'Passionate full-stack developer with strong fundamentals in algorithms and system design. Looking for roles in product companies.',
    'https://linkedin.com/in/priya-sharma-demo', FALSE
  FROM public.profiles p WHERE p.email = 'priya.sharma@campus.edu'
ON CONFLICT (id) DO NOTHING;

-- Student 2 · Demo Admin
INSERT INTO public.profiles (id, email, full_name, role)
  SELECT id, email, 'Placement Officer', 'admin'
  FROM auth.users WHERE email = 'placement.officer@campus.edu'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 5 · ADDITIONAL MOCK STUDENT SKILLS (for existing demo users)
-- ─────────────────────────────────────────────────────────────────────
-- Insert skills for Priya Sharma if the profile exists
INSERT INTO public.student_skills (student_id, skill_name)
  SELECT p.id, skill
  FROM public.profiles p
  CROSS JOIN (VALUES
    ('Python'), ('React.js'), ('Node.js'), ('TypeScript'),
    ('Data Structures'), ('SQL'), ('Docker'), ('Git')
  ) AS s(skill)
  WHERE p.email = 'priya.sharma@campus.edu'
ON CONFLICT (student_id, skill_name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 6 · SAMPLE APPLICATIONS (linked to existing demo student)
-- Only inserted when both student profile and job exist
-- ─────────────────────────────────────────────────────────────────────

-- Priya's applications to Zomato (shortlisted) and TCS (applied)
INSERT INTO public.applications (id, job_id, student_id, status, applied_at, notes)
  SELECT
    'app11111-1111-1111-1111-111111111111'::UUID,
    'a5555555-5555-5555-5555-555555555555',
    p.id,
    'Shortlisted',
    NOW() - INTERVAL '5 days',
    'Strong React skills; shortlisted for machine coding round'
  FROM public.profiles p
  WHERE p.email = 'priya.sharma@campus.edu'
    AND EXISTS (SELECT 1 FROM public.jobs WHERE id = 'a5555555-5555-5555-5555-555555555555')
ON CONFLICT (job_id, student_id) DO NOTHING;

INSERT INTO public.applications (id, job_id, student_id, status, applied_at)
  SELECT
    'app22222-2222-2222-2222-222222222222'::UUID,
    'a6666666-6666-6666-6666-666666666666',
    p.id,
    'Applied',
    NOW() - INTERVAL '2 days'
  FROM public.profiles p
  WHERE p.email = 'priya.sharma@campus.edu'
    AND EXISTS (SELECT 1 FROM public.jobs WHERE id = 'a6666666-6666-6666-6666-666666666666')
ON CONFLICT (job_id, student_id) DO NOTHING;

-- Application status history for the shortlisted application
INSERT INTO public.application_status_history (id, application_id, status, notes)
  SELECT
    'hist1111-1111-1111-1111-111111111111'::UUID,
    'app11111-1111-1111-1111-111111111111',
    'Applied',
    'Initial application received'
  WHERE EXISTS (
    SELECT 1 FROM public.applications WHERE id = 'app11111-1111-1111-1111-111111111111'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.application_status_history (id, application_id, status, notes)
  SELECT
    'hist2222-2222-2222-2222-222222222222'::UUID,
    'app11111-1111-1111-1111-111111111111',
    'Shortlisted',
    'Shortlisted based on CGPA and React proficiency'
  WHERE EXISTS (
    SELECT 1 FROM public.applications WHERE id = 'app11111-1111-1111-1111-111111111111'
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────────────
-- After running this file you should see:
--   · 8 companies in the Companies table
--   · 8 job drives (6 active, 1 upcoming, 1 closed)
--   · 8 eligibility rules
--   · Skills and applications for demo users (if auth accounts exist)
-- ─────────────────────────────────────────────────────────────────────
