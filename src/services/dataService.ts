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
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
    const el = job.eligibility;

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

  // COMPANIES
  public async getCompanies(): Promise<Company[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('companies').select('*').order('name');
        if (!error && data && data.length > 0) return data as Company[];
      } catch (err) {
        console.warn('Falling back to local cache for companies:', err);
      }
    }
    return this.getStorageItem<Company[]>(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
  }

  public async saveCompany(companyData: Partial<Company>): Promise<Company> {
    if (isSupabaseConfigured) {
      try {
        if (companyData.id) {
          const { data, error } = await supabase
            .from('companies')
            .update(companyData)
            .eq('id', companyData.id)
            .select()
            .single();
          if (!error && data) return data as Company;
        } else {
          const { data, error } = await supabase
            .from('companies')
            .insert(companyData)
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
    if (isSupabaseConfigured) {
      try {
        await supabase.from('companies').delete().eq('id', companyId);
      } catch (e) {
        console.warn('Supabase delete error:', e);
      }
    }
    const companies = (await this.getCompanies()).filter((c) => c.id !== companyId);
    this.setStorageItem(STORAGE_KEYS.COMPANIES, companies);
  }

  // JOBS
  public async getJobs(): Promise<Job[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*, company:companies(*), eligibility:job_eligibility(*)')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data as Job[];
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
    const jobs = (await this.getJobs()).filter((j) => j.id !== jobId);
    this.setStorageItem(STORAGE_KEYS.JOBS, jobs);
  }

  // STUDENTS
  public async getStudents(): Promise<(StudentProfile & { full_name: string; email: string })[]> {
    return this.getStorageItem<(StudentProfile & { full_name: string; email: string })[]>(
      STORAGE_KEYS.STUDENTS,
      INITIAL_STUDENTS
    );
  }

  public async getStudentById(studentId: string): Promise<(StudentProfile & { full_name: string; email: string }) | null> {
    const students = await this.getStudents();
    return students.find((s) => s.id === studentId) || null;
  }

  public async updateStudentProfile(
    studentId: string,
    updates: Partial<StudentProfile & { full_name: string; email: string }>
  ): Promise<StudentProfile & { full_name: string; email: string }> {
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

  // APPLICATIONS
  public async getApplications(): Promise<Application[]> {
    return this.getStorageItem<Application[]>(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
  }

  public async getStudentApplications(studentId: string): Promise<Application[]> {
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
    const apps = await this.getApplications();
    const existing = apps.find((a) => a.job_id === job.id && a.student_id === student.id);
    if (existing) {
      return { success: false, message: 'You have already applied for this position!' };
    }

    // 3. Create application
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
    const apps = await this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return null;

    app.status = newStatus;
    app.updated_at = new Date().toISOString();
    if (notes) app.notes = notes;
    if (interviewDate) app.interview_date = interviewDate;

    if (!app.status_history) app.status_history = [];
    app.status_history.push({
      id: 'sh-' + Date.now(),
      application_id: app.id,
      status: newStatus,
      notes: notes || `Status updated to ${newStatus}`,
      created_at: new Date().toISOString(),
    });

    // If selected, automatically mark student as placed
    if (newStatus === 'Selected' && app.student_id && app.job) {
      const students = await this.getStudents();
      const st = students.find((s) => s.id === app.student_id);
      if (st) {
        st.is_placed = true;
        st.current_company = app.job.company ? app.job.company.name : app.job.title;
        st.package_lpa = app.job.salary_max_lpa || app.job.salary_min_lpa;
        this.setStorageItem(STORAGE_KEYS.STUDENTS, students);
      }
    }

    this.setStorageItem(STORAGE_KEYS.APPLICATIONS, apps);
    return app;
  }

  // ANALYTICS CALCULATION (Live dynamic data based on active database)
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
      overallPlacementRate: Number(overallRate.toFixed(1)),
      averagePackageLPA: Number(avgPackage.toFixed(1)),
      highestPackageLPA: Number(highestPackage.toFixed(1)),
      branchStats,
      packageDistribution,
      topCompanies,
      applicationFunnel,
    };
  }

  // EXPORT CSV UTILITIES
  public generatePlacementsCSV(students: (StudentProfile & { full_name: string; email: string })[]): string {
    const headers = ['Full Name', 'Enrollment No', 'Email', 'Branch', 'CGPA', 'Grad Year', 'Placed Status', 'Company', 'Package (LPA)'];
    const rows = students.map((s) => [
      `"${s.full_name}"`,
      `"${s.enrollment_no}"`,
      `"${s.email}"`,
      `"${s.branch}"`,
      s.cgpa,
      s.graduation_year,
      s.is_placed ? 'Placed' : 'Unplaced',
      `"${s.current_company || 'N/A'}"`,
      s.package_lpa || 0,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public generateApplicationsCSV(applications: Application[]): string {
    const headers = ['Student Name', 'Enrollment No', 'Company', 'Job Title', 'Status', 'Applied Date', 'Interview Date'];
    const rows = applications.map((a) => [
      `"${a.student?.full_name || 'N/A'}"`,
      `"${a.student?.enrollment_no || 'N/A'}"`,
      `"${a.job?.company?.name || 'N/A'}"`,
      `"${a.job?.title || 'N/A'}"`,
      `"${a.status}"`,
      `"${new Date(a.applied_at).toLocaleDateString()}"`,
      `"${a.interview_date ? new Date(a.interview_date).toLocaleDateString() : 'N/A'}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const dataService = new DataService();
