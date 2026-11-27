import {
  Company,
  Job,
  StudentProfile,
  Application,
  ApplicationStatus,
  EligibilityResult,
  PlacementAnalytics,
} from '../types';
import {
  INITIAL_COMPANIES,
  INITIAL_JOBS,
  INITIAL_STUDENTS,
  INITIAL_APPLICATIONS,
} from '../data/mockData';
import { supabase, isSupabaseConfigured, createEphemeralAuthClient } from '../lib/supabase';

const STORAGE_KEYS = {
  COMPANIES: 'campushire_companies',
  JOBS: 'campushire_jobs',
  STUDENTS: 'campushire_students',
  APPLICATIONS: 'campushire_applications',
};

class DataService {
  private getStorageItem<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(defaultVal));
        return defaultVal;
      }
      return JSON.parse(data) as T;
    } catch {
      return defaultVal;
    }
  }

  private setStorageItem<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }

  // Check student eligibility for a job
  public checkEligibility(student: StudentProfile | null | undefined, job: Job): EligibilityResult {
    if (!student) {
      return { isEligible: false, reasons: ['Please complete your student profile first'] };
    }

    const reasons: string[] = [];
    const el = job.eligibility || {
      min_cgpa: 0,
      max_backlogs: 0,
      allowed_branches: [],
      allowed_batches: [],
    };

    // Check CGPA
    if (student.cgpa < el.min_cgpa) {
      reasons.push(`Minimum CGPA requirement is ${el.min_cgpa.toFixed(1)} (Your CGPA: ${student.cgpa.toFixed(2)})`);
    }

    // Check Backlogs
    if (student.backlogs > el.max_backlogs) {
      reasons.push(`Maximum allowed active backlogs is ${el.max_backlogs} (You have: ${student.backlogs})`);
    }

    // Check Branch
    if (el.allowed_branches && el.allowed_branches.length > 0) {
      const branchMatch = el.allowed_branches.some(
        (b) => b.trim().toLowerCase() === student.branch.trim().toLowerCase()
      );
      if (!branchMatch) {
        reasons.push(`Eligible branches: ${el.allowed_branches.join(', ')} (Your branch: ${student.branch})`);
      }
    }

    // Check Passing Batch
    if (el.allowed_batches && el.allowed_batches.length > 0) {
      if (!el.allowed_batches.includes(student.graduation_year)) {
        reasons.push(`Eligible batches: ${el.allowed_batches.join(', ')} (Your batch: ${student.graduation_year})`);
      }
    }

    // Check Job Deadline
    if (new Date(job.deadline).getTime() < Date.now()) {
      reasons.push(`Application deadline has passed (${new Date(job.deadline).toLocaleDateString()})`);
    }

    // Check Active status
    if (!job.is_active) {
      reasons.push('This job drive is currently closed/inactive');
    }

    return {
      isEligible: reasons.length === 0,
      reasons,
    };
  }

  // =========================================================================
  // COMPANIES
  // =========================================================================
  public async getCompanies(): Promise<Company[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('name');
        if (!error && data && data.length > 0) {
          return data as Company[];
        }
      } catch (err) {
        console.warn('Falling back to local cache for companies:', err);
      }
    }
    return this.getStorageItem<Company[]>(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
  }

  public async saveCompany(companyData: Partial<Company>): Promise<Company> {
    if (isSupabaseConfigured) {
      try {
        if (companyData.id && !companyData.id.startsWith('comp-')) {
          const { data, error } = await supabase
            .from('companies')
            .update({
              name: companyData.name,
              logo_url: companyData.logo_url,
              website: companyData.website,
              industry: companyData.industry,
              description: companyData.description,
              location: companyData.location,
              contact_email: companyData.contact_email,
            })
            .eq('id', companyData.id)
            .select()
            .single();
          if (!error && data) return data as Company;
        } else {
          const { data, error } = await supabase
            .from('companies')
            .insert({
              name: companyData.name,
              logo_url: companyData.logo_url,
              website: companyData.website,
              industry: companyData.industry,
              description: companyData.description,
              location: companyData.location,
              contact_email: companyData.contact_email,
            })
            .select()
            .single();
          if (!error && data) return data as Company;
        }
      } catch (err) {
        console.warn('Supabase company save failed, writing locally:', err);
      }
    }

    const companies = await this.getCompanies();
    if (companyData.id) {
      const idx = companies.findIndex((c) => c.id === companyData.id);
      if (idx !== -1) {
        companies[idx] = { ...companies[idx], ...companyData } as Company;
        this.setStorageItem(STORAGE_KEYS.COMPANIES, companies);
        return companies[idx];
      }
    }

    const newCompany: Company = {
      id: 'comp-' + Date.now(),
      name: companyData.name || 'New Company',
      logo_url: companyData.logo_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&h=128&fit=crop',
      website: companyData.website || '',
      industry: companyData.industry || 'Information Technology',
      description: companyData.description || '',
      location: companyData.location || 'India',
      contact_email: companyData.contact_email || 'hr@company.com',
      created_at: new Date().toISOString(),
    };
    companies.unshift(newCompany);
    this.setStorageItem(STORAGE_KEYS.COMPANIES, companies);
    return newCompany;
  }

  public async deleteCompany(companyId: string): Promise<void> {
    if (isSupabaseConfigured && !companyId.startsWith('comp-')) {
      try {
        await supabase.from('companies').delete().eq('id', companyId);
      } catch (e) {
        console.warn('Supabase delete error:', e);
      }
    }
    const companies = (await this.getCompanies()).filter((c) => c.id !== companyId);
    this.setStorageItem(STORAGE_KEYS.COMPANIES, companies);
  }

  // =========================================================================
  // JOBS
  // =========================================================================
  public async getJobs(): Promise<Job[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            company:companies(*),
            eligibility:job_eligibility(*)
          `)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((j: any) => ({
            id: j.id,
            company_id: j.company_id,
            company: j.company,
            title: j.title,
            role_category: j.role_category,
            job_type: j.job_type,
            location: j.location,
            salary_min_lpa: Number(j.salary_min_lpa),
            salary_max_lpa: Number(j.salary_max_lpa),
            stipend_monthly: j.stipend_monthly ? Number(j.stipend_monthly) : undefined,
            description: j.description,
            requirements: j.requirements || [],
            selection_process: j.selection_process || [],
            deadline: j.deadline,
            is_active: j.is_active,
            created_at: j.created_at,
            eligibility: (Array.isArray(j.eligibility) ? j.eligibility[0] : j.eligibility) || {
              min_cgpa: 7.0,
              max_backlogs: 0,
              allowed_branches: ['Computer Science & Engineering', 'Information Technology'],
              allowed_batches: [2026, 2027],
            },
          })) as Job[];
        }
      } catch (e) {
        console.warn('Falling back to local cache for jobs:', e);
      }
    }
    return this.getStorageItem<Job[]>(STORAGE_KEYS.JOBS, INITIAL_JOBS);
  }

  public async getJobById(id: string): Promise<Job | null> {
    const jobs = await this.getJobs();
    return jobs.find((j) => j.id === id) || null;
  }

  public async saveJob(jobData: Partial<Job>): Promise<Job> {
    const minSal = Math.max(0, Number(jobData.salary_min_lpa) || 0);
    const maxSal = Math.max(minSal, Number(jobData.salary_max_lpa) || minSal);
    jobData = { ...jobData, salary_min_lpa: minSal, salary_max_lpa: maxSal };

    if (isSupabaseConfigured) {
      try {
        let savedJobId = jobData.id;

        if (savedJobId && !savedJobId.startsWith('job-')) {
          const { data, error } = await supabase
            .from('jobs')
            .update({
              company_id: jobData.company_id,
              title: jobData.title,
              role_category: jobData.role_category,
              job_type: jobData.job_type,
              location: jobData.location,
              salary_min_lpa: jobData.salary_min_lpa,
              salary_max_lpa: jobData.salary_max_lpa,
              stipend_monthly: jobData.stipend_monthly,
              description: jobData.description,
              requirements: jobData.requirements,
              selection_process: jobData.selection_process,
              deadline: jobData.deadline,
              is_active: jobData.is_active,
            })
            .eq('id', savedJobId)
            .select()
            .single();

          if (!error && data) {
            savedJobId = data.id;
          }
        } else {
          const { data, error } = await supabase
            .from('jobs')
            .insert({
              company_id: jobData.company_id,
              title: jobData.title,
              role_category: jobData.role_category,
              job_type: jobData.job_type,
              location: jobData.location,
              salary_min_lpa: jobData.salary_min_lpa,
              salary_max_lpa: jobData.salary_max_lpa,
              stipend_monthly: jobData.stipend_monthly,
              description: jobData.description,
              requirements: jobData.requirements,
              selection_process: jobData.selection_process,
              deadline: jobData.deadline,
              is_active: jobData.is_active ?? true,
            })
            .select()
            .single();

          if (!error && data) {
            savedJobId = data.id;
          }
        }

        // Save eligibility rules in Supabase
        if (savedJobId && jobData.eligibility && !savedJobId.startsWith('job-')) {
          await supabase.from('job_eligibility').upsert({
            job_id: savedJobId,
            min_cgpa: jobData.eligibility.min_cgpa,
            max_backlogs: jobData.eligibility.max_backlogs,
            allowed_branches: jobData.eligibility.allowed_branches,
            allowed_batches: jobData.eligibility.allowed_batches,
          });
        }
      } catch (err) {
        console.warn('Supabase job save error:', err);
      }
    }

    const jobs = await this.getJobs();
    const companies = await this.getCompanies();
    const company = companies.find((c) => c.id === jobData.company_id);

    if (jobData.id) {
      const idx = jobs.findIndex((j) => j.id === jobData.id);
      if (idx !== -1) {
        jobs[idx] = {
          ...jobs[idx],
          ...jobData,
          company: company || jobs[idx].company,
        } as Job;
        this.setStorageItem(STORAGE_KEYS.JOBS, jobs);
        return jobs[idx];
      }
    }

    const newJob: Job = {
      id: 'job-' + Date.now(),
      company_id: jobData.company_id || (companies[0] ? companies[0].id : 'comp-1'),
      company: company || companies[0],
      title: jobData.title || 'New Job Role',
      role_category: jobData.role_category || 'Software Engineering',
      job_type: jobData.job_type || 'Full-time',
      location: jobData.location || 'Pan India',
      salary_min_lpa: Number(jobData.salary_min_lpa) || 10,
      salary_max_lpa: Number(jobData.salary_max_lpa) || 15,
      description: jobData.description || 'Job role description and expectations.',
      requirements: jobData.requirements || ['Solid technical skills', 'Problem solving'],
      selection_process: jobData.selection_process || ['Aptitude Assessment', 'Technical Interview', 'HR Round'],
      deadline: jobData.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
      is_active: jobData.is_active !== undefined ? jobData.is_active : true,
      created_at: new Date().toISOString(),
      eligibility: jobData.eligibility || {
        min_cgpa: 7.0,
        max_backlogs: 0,
        allowed_branches: ['Computer Science & Engineering', 'Information Technology'],
        allowed_batches: [2026, 2027],
      },
    };
    jobs.unshift(newJob);
    this.setStorageItem(STORAGE_KEYS.JOBS, jobs);
    return newJob;
  }

  public async toggleJobStatus(jobId: string): Promise<Job | null> {
    if (isSupabaseConfigured && !jobId.startsWith('job-')) {
      try {
        const job = await this.getJobById(jobId);
        if (job) {
          await supabase
            .from('jobs')
            .update({ is_active: !job.is_active })
            .eq('id', jobId);
        }
      } catch (e) {
        console.warn('Supabase toggle error:', e);
      }
    }
    const jobs = await this.getJobs();
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      job.is_active = !job.is_active;
      this.setStorageItem(STORAGE_KEYS.JOBS, jobs);
      return job;
    }
    return null;
  }

  public async deleteJob(jobId: string): Promise<void> {
    if (isSupabaseConfigured && !jobId.startsWith('job-')) {
      try {
        await supabase.from('jobs').delete().eq('id', jobId);
      } catch (e) {
        console.warn('Supabase delete error:', e);
      }
    }
    const jobs = (await this.getJobs()).filter((j) => j.id !== jobId);
    this.setStorageItem(STORAGE_KEYS.JOBS, jobs);
  }

  // =========================================================================
  // STUDENTS
  // =========================================================================
  public async getStudents(): Promise<(StudentProfile & { full_name: string; email: string })[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('student_profiles')
          .select(`
            *,
            profile:profiles(full_name, email, avatar_url),
            skills:student_skills(skill_name)
          `);

        if (!error && data && data.length > 0) {
          return data.map((s: any) => ({
            id: s.id,
            full_name: s.profile?.full_name || 'Student Name',
            email: s.profile?.email || 'student@campus.edu',
            enrollment_no: s.enrollment_no || 'N/A',
            phone: s.phone || '',
            branch: s.branch || 'Computer Science & Engineering',
            graduation_year: Number(s.graduation_year) || 2027,
            cgpa: Number(s.cgpa) || 0,
            backlogs: Number(s.backlogs) || 0,
            resume_url: s.resume_url || '',
            linkedin_url: s.linkedin_url || '',
            github_url: s.github_url || '',
            portfolio_url: s.portfolio_url || '',
            bio: s.bio || '',
            is_placed: Boolean(s.is_placed),
            current_company: s.current_company || undefined,
            package_lpa: s.package_lpa ? Number(s.package_lpa) : undefined,
            skills: Array.isArray(s.skills) ? s.skills.map((sk: any) => sk.skill_name) : ['Python', 'SQL'],
          }));
        }
      } catch (e) {
        console.warn('Falling back to local cache for students:', e);
      }
    }
    return this.getStorageItem<(StudentProfile & { full_name: string; email: string })[]>(
      STORAGE_KEYS.STUDENTS,
      INITIAL_STUDENTS
    );
  }

  public async getStudentById(studentId: string): Promise<(StudentProfile & { full_name: string; email: string }) | null> {
    if (isSupabaseConfigured && !studentId.startsWith('stud-')) {
      try {
        const { data, error } = await supabase
          .from('student_profiles')
          .select(`
            *,
            profile:profiles(full_name, email, avatar_url),
            skills:student_skills(skill_name)
          `)
          .eq('id', studentId)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            full_name: data.profile?.full_name || 'Student Name',
            email: data.profile?.email || 'student@campus.edu',
            enrollment_no: data.enrollment_no || 'N/A',
            phone: data.phone || '',
            branch: data.branch || 'Computer Science & Engineering',
            graduation_year: Number(data.graduation_year) || 2027,
            cgpa: Number(data.cgpa) || 0,
            backlogs: Number(data.backlogs) || 0,
            resume_url: data.resume_url || '',
            linkedin_url: data.linkedin_url || '',
            github_url: data.github_url || '',
            portfolio_url: data.portfolio_url || '',
            bio: data.bio || '',
            is_placed: Boolean(data.is_placed),
            current_company: data.current_company || undefined,
            package_lpa: data.package_lpa ? Number(data.package_lpa) : undefined,
            skills: Array.isArray(data.skills) ? data.skills.map((sk: any) => sk.skill_name) : ['Python', 'SQL'],
          };
        }
      } catch (e) {
        console.warn('Supabase student lookup error:', e);
      }
    }

    const students = await this.getStudents();
    return students.find((s) => s.id === studentId) || null;
  }

  public async updateStudentProfile(
    studentId: string,
    updates: Partial<StudentProfile & { full_name: string; email: string; avatar_url?: string }>
  ): Promise<StudentProfile & { full_name: string; email: string }> {
    if (isSupabaseConfigured && !studentId.startsWith('stud-') && !studentId.startsWith('user-')) {
      try {
        // Update user profile table if name or avatar_url is updated
        const profileUpdates: Record<string, string> = {};
        if (updates.full_name) profileUpdates.full_name = updates.full_name;
        if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;

        if (Object.keys(profileUpdates).length > 0) {
          await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', studentId);
        }

        // Upsert into student_profiles (never include placement fields from student profile edits)
        const { error: spError } = await supabase.from('student_profiles').upsert({
          id: studentId,
          enrollment_no: updates.enrollment_no,
          phone: updates.phone,
          branch: updates.branch,
          graduation_year: updates.graduation_year,
          cgpa: updates.cgpa,
          backlogs: updates.backlogs,
          resume_url: updates.resume_url,
          linkedin_url: updates.linkedin_url,
          github_url: updates.github_url,
          portfolio_url: updates.portfolio_url,
          bio: updates.bio,
        });
        if (spError) {
          throw new Error(spError.message);
        }

        // Update skills if provided
        if (updates.skills && Array.isArray(updates.skills)) {
          // Clean existing skills
          await supabase.from('student_skills').delete().eq('student_id', studentId);
          // Insert new skills
          const skillsToInsert = updates.skills.map((skill_name) => ({
            student_id: studentId,
            skill_name,
          }));
          if (skillsToInsert.length > 0) {
            await supabase.from('student_skills').insert(skillsToInsert);
          }
        }
      } catch (err) {
        console.warn('Supabase student profile update error:', err);
      }
    }

    const students = await this.getStudents();
    const idx = students.findIndex((s) => s.id === studentId);
    if (idx !== -1) {
      students[idx] = { ...students[idx], ...updates };
      this.setStorageItem(STORAGE_KEYS.STUDENTS, students);
      return students[idx];
    }

    const newStudent = {
      id: studentId,
      full_name: updates.full_name || 'Student Name',
      email: updates.email || 'student@campus.edu',
      enrollment_no: updates.enrollment_no || '2023CS' + Math.floor(100 + Math.random() * 900),
      phone: updates.phone || '+91 98000 00000',
      branch: updates.branch || 'Computer Science & Engineering',
      graduation_year: updates.graduation_year || 2027,
      cgpa: updates.cgpa !== undefined ? updates.cgpa : 8.0,
      backlogs: updates.backlogs !== undefined ? updates.backlogs : 0,
      is_placed: false,
      skills: updates.skills || ['Python', 'SQL', 'React'],
      ...updates,
    };
    students.push(newStudent);
    this.setStorageItem(STORAGE_KEYS.STUDENTS, students);
    return newStudent;
  }

  public async adminRegisterStudent(input: {
    full_name: string;
    email: string;
    password: string;
    enrollment_no: string;
    branch: string;
    graduation_year: number;
    cgpa: number;
    backlogs?: number;
    phone?: string;
  }): Promise<{ success: boolean; error?: string; message?: string }> {
    if (!input.full_name.trim() || !input.email.trim() || !input.enrollment_no.trim()) {
      return { success: false, error: 'Full name, email, and enrollment number are required.' };
    }
    if (!input.password || input.password.length < 6) {
      return { success: false, error: 'Temporary password must be at least 6 characters.' };
    }
    if (isNaN(input.cgpa) || input.cgpa < 0 || input.cgpa > 10) {
      return { success: false, error: 'CGPA must be between 0.00 and 10.00.' };
    }
    if ((input.backlogs ?? 0) < 0) {
      return { success: false, error: 'Backlogs cannot be negative.' };
    }

    if (isSupabaseConfigured) {
      try {
        const ephemeralClient = createEphemeralAuthClient();
        const { data: authData, error } = await ephemeralClient.auth.signUp({
          email: input.email.trim(),
          password: input.password,
          options: {
            data: {
              full_name: input.full_name.trim(),
              role: 'student',
              enrollment_no: input.enrollment_no.trim(),
              branch: input.branch,
              graduation_year: input.graduation_year,
              cgpa: input.cgpa,
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered') || error.message.includes('already been registered')) {
            return { success: false, error: 'A student with this email is already registered.' };
          }
          if (error.message.includes('Database error')) {
            return {
              success: false,
              error: 'Database error while registering student. This enrollment number may already exist.',
            };
          }
          return { success: false, error: error.message };
        }

        if (authData.user) {
          // Update optional fields (phone, backlogs) using Admin's authenticated client
          if (input.phone || (input.backlogs !== undefined && input.backlogs > 0)) {
            await supabase
              .from('student_profiles')
              .update({
                phone: input.phone?.trim() || null,
                backlogs: input.backlogs ?? 0,
              })
              .eq('id', authData.user.id);
          }

          return {
            success: true,
            message: authData.session
              ? `Student ${input.full_name} registered and ready to sign in.`
              : `Student ${input.full_name} registered! A confirmation email was sent to ${input.email}.`,
          };
        }

        return { success: false, error: 'Could not register student.' };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Registration failed.' };
      }
    }

    // Local / Mock fallback
    const students = await this.getStudents();
    if (students.some((s) => s.email.toLowerCase() === input.email.trim().toLowerCase())) {
      return { success: false, error: 'A student with this email already exists.' };
    }
    const newId = 'stud-' + Date.now();
    const newStudent: StudentProfile & { full_name: string; email: string } = {
      id: newId,
      full_name: input.full_name.trim(),
      email: input.email.trim(),
      enrollment_no: input.enrollment_no.trim(),
      phone: input.phone?.trim() || '',
      branch: input.branch,
      graduation_year: input.graduation_year,
      cgpa: input.cgpa,
      backlogs: input.backlogs ?? 0,
      is_placed: false,
      skills: ['Problem Solving'],
    };
    students.unshift(newStudent);
    this.setStorageItem(STORAGE_KEYS.STUDENTS, students);
    return { success: true, message: `Student ${input.full_name} added to directory.` };
  }

  // =========================================================================
  // APPLICATIONS
  // =========================================================================
  public async getApplications(): Promise<Application[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            *,
            job:jobs(*, company:companies(*)),
            student:student_profiles(*, profile:profiles(full_name, email), student_skills(skill_name)),
            status_history:application_status_history(*)
          `)
          .order('applied_at', { ascending: false });

        if (!error && data) {
          return data.map((a: any) => ({
            id: a.id,
            job_id: a.job_id,
            job: a.job,
            student_id: a.student_id,
            student: a.student ? {
              ...a.student,
              full_name: a.student.profile?.full_name || 'Candidate',
              email: a.student.profile?.email || 'student@campus.edu',
              skills: Array.isArray(a.student.student_skills)
                ? a.student.student_skills.map((s: any) => s.skill_name)
                : [],
            } : undefined,
            status: a.status,
            applied_at: a.applied_at,
            notes: a.notes,
            interview_date: a.interview_date,
            updated_at: a.updated_at,
            status_history: a.status_history || [],
            offer_status: a.offer_status || undefined,
            offer_package_lpa: a.offer_package_lpa !== null && a.offer_package_lpa !== undefined ? Number(a.offer_package_lpa) : undefined,
            offer_date: a.offer_date || undefined,
            offer_details: a.offer_details || undefined,
            offer_issued_at: a.offer_issued_at || undefined,
            offer_responded_at: a.offer_responded_at || undefined,
          }));
        }
      } catch (e) {
        console.warn('Falling back to local cache for applications:', e);
      }
    }
    return this.getStorageItem<Application[]>(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
  }

  public async getStudentApplications(studentId: string): Promise<Application[]> {
    if (isSupabaseConfigured && !studentId.startsWith('stud-')) {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            *,
            job:jobs(*, company:companies(*)),
            status_history:application_status_history(*)
          `)
          .eq('student_id', studentId)
          .order('applied_at', { ascending: false });

        if (!error && data) {
          return data.map((a: any) => ({
            id: a.id,
            job_id: a.job_id,
            job: a.job,
            student_id: a.student_id,
            status: a.status,
            applied_at: a.applied_at,
            notes: a.notes,
            interview_date: a.interview_date,
            updated_at: a.updated_at,
            status_history: a.status_history || [],
            offer_status: a.offer_status || undefined,
            offer_package_lpa: a.offer_package_lpa !== null && a.offer_package_lpa !== undefined ? Number(a.offer_package_lpa) : undefined,
            offer_date: a.offer_date || undefined,
            offer_details: a.offer_details || undefined,
            offer_issued_at: a.offer_issued_at || undefined,
            offer_responded_at: a.offer_responded_at || undefined,
          }));
        }
      } catch (e) {
        console.warn('Supabase student applications error:', e);
      }
    }

    const apps = await this.getApplications();
    return apps.filter((a) => a.student_id === studentId);
  }

  public async applyToJob(
    student: StudentProfile & { full_name: string; email: string },
    job: Job
  ): Promise<{ success: boolean; message: string; application?: Application }> {
    // 1. Check eligibility
    const elCheck = this.checkEligibility(student, job);
    if (!elCheck.isEligible) {
      return { success: false, message: elCheck.reasons.join('; ') };
    }

    // 2. Check existing application (prevent duplicates)
    if (isSupabaseConfigured && !student.id.startsWith('stud-') && !job.id.startsWith('job-')) {
      try {
        const { data: existingApp } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', job.id)
          .eq('student_id', student.id)
          .maybeSingle();

        if (existingApp) {
          return { success: false, message: 'You have already applied for this position!' };
        }

        const { data: newApp, error: insertError } = await supabase
          .from('applications')
          .insert({
            job_id: job.id,
            student_id: student.id,
            status: 'Applied',
            notes: 'Application submitted via student portal.',
          })
          .select()
          .single();

        if (insertError) {
          return {
            success: false,
            message: insertError.message || 'Could not submit application.',
          };
        }

        if (newApp) {
          // Status history is also inserted by DB trigger; ignore RLS error if trigger handles it
          try {
            await supabase.from('application_status_history').insert({
              application_id: newApp.id,
              status: 'Applied',
              notes: 'Application registered in Supabase database.',
            });
          } catch {
            // Handled by database trigger
          }

          return {
            success: true,
            message: 'Application submitted successfully!',
            application: {
              ...newApp,
              job,
              student,
            },
          };
        }
      } catch (err: any) {
        return { success: false, message: err?.message || 'Failed to submit application.' };
      }
    }

    // Local / Demo Fallback
    const apps = await this.getApplications();
    const existing = apps.find((a) => a.job_id === job.id && a.student_id === student.id);
    if (existing) {
      return { success: false, message: 'You have already applied for this position!' };
    }

    const newApp: Application = {
      id: 'app-' + Date.now(),
      job_id: job.id,
      job,
      student_id: student.id,
      student,
      status: 'Applied',
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status_history: [
        {
          id: 'sh-' + Date.now(),
          application_id: 'app-' + Date.now(),
          status: 'Applied',
          notes: 'Application successfully submitted by student.',
          created_at: new Date().toISOString(),
        },
      ],
    };

    apps.unshift(newApp);
    this.setStorageItem(STORAGE_KEYS.APPLICATIONS, apps);
    return { success: true, message: 'Application submitted successfully!', application: newApp };
  }

  public async updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    notes?: string,
    interviewDate?: string
  ): Promise<Application | null> {
    if (isSupabaseConfigured && !applicationId.startsWith('app-')) {
      const { error: updateErr } = await supabase
        .from('applications')
        .update({
          status: newStatus,
          notes: notes || null,
          interview_date: interviewDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (updateErr) {
        throw new Error(updateErr.message || 'Failed to update application status.');
      }

      const { error: histErr } = await supabase.from('application_status_history').insert({
        application_id: applicationId,
        status: newStatus,
        notes: notes || `Status updated to ${newStatus}`,
      });

      if (histErr) {
        console.warn('Status history insert warning:', histErr.message);
      }

      const apps = await this.getApplications();
      return apps.find((a) => a.id === applicationId) || null;
    }

    const apps = await this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return null;

    app.status = newStatus;
    app.updated_at = new Date().toISOString();
    if (notes !== undefined) app.notes = notes;
    if (interviewDate !== undefined) app.interview_date = interviewDate;

    if (!app.status_history) app.status_history = [];
    app.status_history.push({
      id: 'sh-' + Date.now(),
      application_id: app.id,
      status: newStatus,
      notes: notes || `Status updated to ${newStatus}`,
      created_at: new Date().toISOString(),
    });

    this.setStorageItem(STORAGE_KEYS.APPLICATIONS, apps);
    return app;
  }

  public async issueOffer(
    applicationId: string,
    offer: {
      packageLpa: number;
      offerDate: string;
      details?: string;
    }
  ): Promise<{ success: boolean; message: string; application?: Application }> {
    if (isNaN(offer.packageLpa) || offer.packageLpa < 0) {
      return { success: false, message: 'Offer package must be a valid non-negative number.' };
    }
    if (!offer.offerDate) {
      return { success: false, message: 'Offer date is required.' };
    }

    const now = new Date().toISOString();
    const historyNote = `Official job offer issued: ₹${offer.packageLpa} LPA (Offer Date: ${offer.offerDate})${offer.details ? ` — ${offer.details}` : ''}`;

    if (isSupabaseConfigured && !applicationId.startsWith('app-')) {
      const { error: updateErr } = await supabase
        .from('applications')
        .update({
          status: 'Selected',
          offer_status: 'Pending',
          offer_package_lpa: offer.packageLpa,
          offer_date: offer.offerDate,
          offer_details: offer.details?.trim() || null,
          offer_issued_at: now,
          offer_responded_at: null,
          updated_at: now,
        })
        .eq('id', applicationId);

      if (updateErr) {
        return { success: false, message: updateErr.message || 'Failed to issue offer.' };
      }

      await supabase.from('application_status_history').insert({
        application_id: applicationId,
        status: 'Selected',
        notes: historyNote,
      });

      const apps = await this.getApplications();
      const updated = apps.find((a) => a.id === applicationId);
      return { success: true, message: 'Job offer issued to candidate!', application: updated };
    }

    // Local / Demo Fallback
    const apps = await this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) {
      return { success: false, message: 'Application not found.' };
    }

    app.status = 'Selected';
    app.offer_status = 'Pending';
    app.offer_package_lpa = offer.packageLpa;
    app.offer_date = offer.offerDate;
    app.offer_details = offer.details?.trim() || undefined;
    app.offer_issued_at = now;
    app.offer_responded_at = undefined;
    app.updated_at = now;

    if (!app.status_history) app.status_history = [];
    app.status_history.push({
      id: 'sh-' + Date.now(),
      application_id: app.id,
      status: 'Selected',
      notes: historyNote,
      created_at: now,
    });

    this.setStorageItem(STORAGE_KEYS.APPLICATIONS, apps);
    return { success: true, message: 'Job offer issued to candidate!', application: app };
  }

  public async respondToOffer(
    applicationId: string,
    decision: 'Accepted' | 'Declined'
  ): Promise<{ success: boolean; message: string; application?: Application }> {
    if (isSupabaseConfigured && !applicationId.startsWith('app-')) {
      const { error } = await supabase.rpc('respond_to_offer', {
        p_application_id: applicationId,
        p_decision: decision,
      });

      if (error) {
        return { success: false, message: error.message || `Failed to ${decision.toLowerCase()} offer.` };
      }

      const apps = await this.getApplications();
      const updated = apps.find((a) => a.id === applicationId);
      return {
        success: true,
        message:
          decision === 'Accepted'
            ? 'Congratulations! You have accepted the job offer.'
            : 'You have declined this job offer.',
        application: updated,
      };
    }

    // Local / Demo Fallback
    const apps = await this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) {
      return { success: false, message: 'Application not found.' };
    }
    if (app.status !== 'Selected' || app.offer_status !== 'Pending') {
      return { success: false, message: 'This offer is no longer pending.' };
    }

    const now = new Date().toISOString();
    app.offer_status = decision;
    app.offer_responded_at = now;
    app.updated_at = now;

    if (!app.status_history) app.status_history = [];
    app.status_history.push({
      id: 'sh-' + Date.now(),
      application_id: app.id,
      status: 'Selected',
      notes:
        decision === 'Accepted'
          ? 'Student accepted the official job offer.'
          : 'Student declined the official job offer.',
      created_at: now,
    });

    if (decision === 'Accepted' && app.student_id && app.job) {
      const students = await this.getStudents();
      const st = students.find((s) => s.id === app.student_id);
      if (st) {
        st.is_placed = true;
        st.current_company = app.job.company ? app.job.company.name : app.job.title;
        st.package_lpa = app.offer_package_lpa ?? app.job.salary_max_lpa ?? app.job.salary_min_lpa;
        this.setStorageItem(STORAGE_KEYS.STUDENTS, students);
      }
    }

    this.setStorageItem(STORAGE_KEYS.APPLICATIONS, apps);
    return {
      success: true,
      message:
        decision === 'Accepted'
          ? 'Congratulations! You have accepted the job offer.'
          : 'You have declined this job offer.',
      application: app,
    };
  }

  // =========================================================================
  // ANALYTICS (Live dynamic calculations)
  // =========================================================================
  public async getAnalytics(): Promise<PlacementAnalytics> {
    const students = await this.getStudents();
    const companies = await this.getCompanies();
    const jobs = await this.getJobs();
    const applications = await this.getApplications();

    const placedStudents = students.filter((s) => s.is_placed);
    const overallRate = students.length > 0 ? (placedStudents.length / students.length) * 100 : 0;

    const packages = placedStudents
      .map((s) => s.package_lpa || 0)
      .filter((p) => p > 0);
    const avgPackage = packages.length > 0 ? packages.reduce((a, b) => a + b, 0) / packages.length : 0;
    const highestPackage = packages.length > 0 ? Math.max(...packages) : 0;

    // Branch statistics
    const branchMap = new Map<string, { total: number; placed: number; totalPkg: number }>();
    students.forEach((s) => {
      const b = s.branch || 'Other';
      const curr = branchMap.get(b) || { total: 0, placed: 0, totalPkg: 0 };
      curr.total += 1;
      if (s.is_placed) {
        curr.placed += 1;
        curr.totalPkg += s.package_lpa || 0;
      }
      branchMap.set(b, curr);
    });

    const branchStats = Array.from(branchMap.entries()).map(([branch, val]) => ({
      branch: branch.replace(' Engineering', ''),
      total: val.total,
      placed: val.placed,
      placementRate: Math.round((val.placed / (val.total || 1)) * 100),
      avgPackage: val.placed > 0 ? Number((val.totalPkg / val.placed).toFixed(1)) : 0,
    }));

    // Package Distribution
    const packageDistribution = [
      { range: '< 8 LPA', count: packages.filter((p) => p < 8).length },
      { range: '8 - 15 LPA', count: packages.filter((p) => p >= 8 && p < 15).length },
      { range: '15 - 25 LPA', count: packages.filter((p) => p >= 15 && p < 25).length },
      { range: '25+ LPA', count: packages.filter((p) => p >= 25).length },
    ];

    // Top Companies
    const companyHiresMap = new Map<string, { hires: number; totalPkg: number }>();
    placedStudents.forEach((s) => {
      if (s.current_company) {
        const c = companyHiresMap.get(s.current_company) || { hires: 0, totalPkg: 0 };
        c.hires += 1;
        c.totalPkg += s.package_lpa || 0;
        companyHiresMap.set(s.current_company, c);
      }
    });

    const topCompanies = Array.from(companyHiresMap.entries())
      .map(([name, val]) => ({
        name,
        hires: val.hires,
        avgPackage: Number((val.totalPkg / (val.hires || 1)).toFixed(1)),
      }))
      .sort((a, b) => b.hires - a.hires)
      .slice(0, 5);

    // Application funnel
    const statuses: ApplicationStatus[] = [
      'Applied',
      'Under Review',
      'Shortlisted',
      'Interview Scheduled',
      'Selected',
      'Rejected',
    ];
    const applicationFunnel = statuses.map((st) => ({
      status: st,
      count: applications.filter((a) => a.status === st).length,
    }));

    return {
      totalStudents: students.length,
      registeredStudents: students.length,
      totalCompanies: companies.length,
      activeJobs: jobs.filter((j) => j.is_active).length,
      totalApplications: applications.length,
      shortlistedCount: applications.filter((a) => a.status === 'Shortlisted').length,
      selectedCount: applications.filter((a) => a.status === 'Selected').length,
      offersIssued: applications.filter((a) => !!a.offer_status).length,
      offersAccepted: applications.filter((a) => a.offer_status === 'Accepted').length,
      offersPending: applications.filter((a) => a.offer_status === 'Pending').length,
      offersDeclined: applications.filter((a) => a.offer_status === 'Declined').length,
      overallPlacementRate: Number(overallRate.toFixed(1)),
      averagePackageLPA: Number(avgPackage.toFixed(1)),
      highestPackageLPA: Number(highestPackage.toFixed(1)),
      branchStats,
      packageDistribution,
      topCompanies,
      applicationFunnel,
    };
  }

  // =========================================================================
  // EXPORT CSV UTILITIES
  // =========================================================================
  private sanitizeCsvCell(value: unknown): string {
    const str = String(value ?? '');
    // Prevent CSV formula injection (=, +, -, @, tab, CR)
    const formulaSafe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    return `"${formulaSafe.replace(/"/g, '""')}"`;
  }

  public generatePlacementsCSV(students: (StudentProfile & { full_name: string; email: string })[]): string {
    const headers = ['Full Name', 'Enrollment No', 'Email', 'Branch', 'CGPA', 'Grad Year', 'Placed Status', 'Company', 'Package (LPA)'];
    const rows = students.map((s) => [
      this.sanitizeCsvCell(s.full_name),
      this.sanitizeCsvCell(s.enrollment_no),
      this.sanitizeCsvCell(s.email),
      this.sanitizeCsvCell(s.branch),
      s.cgpa,
      s.graduation_year,
      s.is_placed ? 'Placed' : 'Unplaced',
      this.sanitizeCsvCell(s.current_company || 'N/A'),
      s.package_lpa || 0,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public generateApplicationsCSV(applications: Application[]): string {
    const headers = ['Student Name', 'Enrollment No', 'Company', 'Job Title', 'Status', 'Offer Status', 'Offered Package (LPA)', 'Applied Date', 'Interview Date'];
    const rows = applications.map((a) => [
      this.sanitizeCsvCell(a.student?.full_name || 'N/A'),
      this.sanitizeCsvCell(a.student?.enrollment_no || 'N/A'),
      this.sanitizeCsvCell(a.job?.company?.name || 'N/A'),
      this.sanitizeCsvCell(a.job?.title || 'N/A'),
      this.sanitizeCsvCell(a.status),
      this.sanitizeCsvCell(a.offer_status || 'Not Issued'),
      a.offer_package_lpa ?? '',
      this.sanitizeCsvCell(new Date(a.applied_at).toLocaleDateString()),
      this.sanitizeCsvCell(a.interview_date ? new Date(a.interview_date).toLocaleDateString() : 'N/A'),
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const dataService = new DataService();
