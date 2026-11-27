-- =====================================================================
-- SMART CAMPUS RECRUITMENT SYSTEM (CampusHire)
-- Realistic Seed Data for SQL Editor
-- =====================================================================

-- Insert Companies
INSERT INTO public.companies (id, name, logo_url, website, industry, description, location, contact_email)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Google India', 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&h=128&fit=crop&crop=faces', 'https://careers.google.com', 'Software & Cloud Services', 'Google is a global technology leader focusing on search, cloud computing, AI, and advertising technologies.', 'Bangalore / Hyderabad', 'university-recruiting@google.com'),
  ('c2222222-2222-2222-2222-222222222222', 'Microsoft IDC', 'https://images.unsplash.com/photo-1642132652075-2bfa3e8784d8?w=128&h=128&fit=crop&crop=faces', 'https://careers.microsoft.com', 'Enterprise Software & AI', 'Microsoft India Development Center is one of Microsoft’s largest R&D centers outside of Redmond.', 'Hyderabad / Noida / Bangalore', 'campus-india@microsoft.com'),
  ('c3333333-3333-3333-3333-333333333333', 'Amazon Web Services', 'https://images.unsplash.com/photo-1523474255658-4af61825044d?w=128&h=128&fit=crop&crop=faces', 'https://amazon.jobs', 'Cloud Infrastructure & E-Commerce', 'AWS provides on-demand cloud computing platforms and APIs globally.', 'Bangalore / Chennai / Hyderabad', 'aws-campus-hire@amazon.com'),
  ('c4444444-4444-4444-4444-444444444444', 'Cisco Systems', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&h=128&fit=crop&crop=faces', 'https://jobs.cisco.com', 'Networking & Cybersecurity', 'Cisco shapes the future of the Internet through secure networking hardware and cloud software.', 'Bangalore, India', 'india-gradrecruitment@cisco.com'),
  ('c5555555-5555-5555-5555-555555555555', 'Zomato & Blinkit', 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=128&h=128&fit=crop&crop=faces', 'https://zomato.com/careers', 'Food Delivery & Quick Commerce', 'Pioneering consumer internet company transforming hyper-local logistics.', 'Gurugram / Hybrid', 'campus@zomato.com'),
  ('c6666666-6666-6666-6666-666666666666', 'TCS Digital', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&h=128&fit=crop&crop=faces', 'https://tcs.com/careers', 'IT Services & Consulting', 'TCS Digital wing focuses on advanced technical roles in Big Data, AI, and Full-Stack.', 'Pan India', 'digital.campus@tcs.com')
ON CONFLICT (id) DO NOTHING;

-- Insert Jobs
INSERT INTO public.jobs (id, company_id, title, role_category, job_type, location, salary_min_lpa, salary_max_lpa, description, requirements, selection_process, deadline, is_active)
VALUES
  ('j1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Software Development Engineer - 1', 'Software Engineering', 'Full-time', 'Bangalore, India', 32, 42, 'Design and implement distributed, high-throughput cloud systems.', ARRAY['Data Structures & Algorithms', 'C++ or Java or Python', 'System Design fundamentals'], ARRAY['Online Coding Assessment (90 mins)', 'Technical Round 1 (DSA)', 'Technical Round 2 (System Design)', 'Googleyness & Leadership'], '2026-12-15 23:59:59+00', TRUE),
  ('j2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'Associate Cloud Solution Architect', 'Cloud & DevOps', 'Full-time', 'Hyderabad, India', 24, 30, 'Partner with enterprises on Azure architecture, microservices, and containerization.', ARRAY['Cloud architecture basics', 'Scripting (Python/Bash)', 'Client communication'], ARRAY['Aptitude & Technical MCQ', 'Cloud Scenario Hands-on', 'Techno-Managerial', 'HR Discussion'], '2026-12-20 23:59:59+00', TRUE),
  ('j3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Software Development Engineer Intern', 'Software Engineering', 'Intern + PPO', 'Bangalore, India', 28, 35, '6-month intensive summer internship with direct conversion to Full-Time SDE.', ARRAY['Java/C++', 'Object-Oriented Design', 'Problem Solving'], ARRAY['Amazon OA (2 DSA + Debugging)', 'Technical Interview 1', 'Leadership Principles Interview'], '2026-12-10 23:59:59+00', TRUE),
  ('j4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'Cybersecurity & Network Engineer', 'Cybersecurity', 'Full-time', 'Bangalore, India', 16, 22, 'Develop automated security telemetry and threat prevention tools.', ARRAY['TCP/IP & Routing', 'Network Security', 'Python scripting'], ARRAY['Cisco Networking Assessment', 'Technical Deep Dive', 'Security Case Study'], '2026-12-28 23:59:59+00', TRUE),
  ('j5555555-5555-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', 'Product Engineer - Frontend', 'Frontend Engineering', 'Full-time', 'Gurugram / Hybrid', 18, 26, 'Build fast, responsive interfaces using React, TypeScript, and Tailwind.', ARRAY['React.js & TypeScript', 'Modern CSS & Performance', 'REST/GraphQL APIs'], ARRAY['Machine Coding Assessment', 'Architecture Deep-Dive', 'Culture Fit'], '2026-12-18 23:59:59+00', TRUE),
  ('j6666666-6666-6666-6666-666666666666', 'c6666666-6666-6666-6666-666666666666', 'Systems & Data Analyst', 'Data & Analytics', 'Full-time', 'Pan India', 7.5, 9.5, 'Modern enterprise analytics, ETL pipelines, and business dashboards.', ARRAY['SQL & Python', 'Data Visualization', 'Database Fundamentals'], ARRAY['TCS NQT Test', 'Technical Interview', 'HR Interview'], '2026-12-30 23:59:59+00', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insert Job Eligibility Rules
INSERT INTO public.job_eligibility (job_id, min_cgpa, max_backlogs, allowed_branches, allowed_batches, required_skills)
VALUES
  ('j1111111-1111-1111-1111-111111111111', 8.00, 0, ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication'], ARRAY[2026, 2027], ARRAY['Data Structures', 'Algorithms', 'Java or C++']),
  ('j2222222-2222-2222-2222-222222222222', 7.50, 0, ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication', 'Electrical Engineering'], ARRAY[2026, 2027], ARRAY['Cloud Computing', 'Azure or AWS', 'Python']),
  ('j3333333-3333-3333-3333-333333333333', 7.00, 1, ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication'], ARRAY[2026, 2027], ARRAY['Java', 'Algorithms', 'SQL']),
  ('j4444444-4444-4444-4444-444444444444', 7.00, 0, ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication', 'Electrical Engineering'], ARRAY[2026, 2027], ARRAY['TCP/IP', 'Network Security', 'Linux']),
  ('j5555555-5555-5555-5555-555555555555', 6.50, 2, ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering'], ARRAY[2026, 2027], ARRAY['React', 'TypeScript', 'Tailwind CSS']),
  ('j6666666-6666-6666-6666-666666666666', 6.00, 1, ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'], ARRAY[2026, 2027], ARRAY['SQL', 'Python', 'Excel'])
ON CONFLICT (job_id) DO NOTHING;
