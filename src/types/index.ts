export type UserRole = 'student' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  enrollment_no: string;
  phone: string;
  branch: string;
  graduation_year: number;
  cgpa: number;
  backlogs: number;
  resume_url?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  bio?: string;
  is_placed: boolean;
  current_company?: string;
  package_lpa?: number;
  skills: string[];
}

export interface Company {
  id: string;
  name: string;
  logo_url: string;
  website: string;
  industry: string;
  description: string;
  location: string;
  contact_email: string;
  created_at: string;
}

export interface JobEligibility {
  min_cgpa: number;
  max_backlogs: number;
  allowed_branches: string[];
  allowed_batches: number[];
  required_skills?: string[];
}

export interface Job {
  id: string;
  company_id: string;
  company?: Company;
  title: string;
  role_category: string;
  job_type: 'Full-time' | 'Internship' | 'Intern + PPO';
  location: string;
  salary_min_lpa: number;
  salary_max_lpa: number;
  stipend_monthly?: number;
  description: string;
  requirements: string[];
  selection_process: string[];
  deadline: string;
  is_active: boolean;
  created_at: string;
  eligibility: JobEligibility;
}

export type ApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Rejected';

export type OfferStatus = 'Pending' | 'Accepted' | 'Declined';

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  status: ApplicationStatus;
  notes?: string;
  updated_by?: string;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  job?: Job;
  student_id: string;
  student?: StudentProfile & { full_name: string; email: string };
  status: ApplicationStatus;
  applied_at: string;
  notes?: string;
  interview_date?: string;
  updated_at: string;
  status_history?: ApplicationStatusHistory[];
  offer_status?: OfferStatus;
  offer_package_lpa?: number;
  offer_date?: string;
  offer_details?: string;
  offer_issued_at?: string;
  offer_responded_at?: string;
}

export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
}

export interface PlacementAnalytics {
  totalStudents: number;
  registeredStudents: number;
  totalCompanies: number;
  activeJobs: number;
  totalApplications: number;
  shortlistedCount: number;
  selectedCount: number;
  offersIssued: number;
  offersAccepted: number;
  offersPending: number;
  offersDeclined: number;
  overallPlacementRate: number;
  averagePackageLPA: number;
  highestPackageLPA: number;
  branchStats: {
    branch: string;
    total: number;
    placed: number;
    placementRate: number;
    avgPackage: number;
  }[];
  packageDistribution: {
    range: string;
    count: number;
  }[];
  topCompanies: {
    name: string;
    hires: number;
    avgPackage: number;
  }[];
  applicationFunnel: {
    status: ApplicationStatus;
    count: number;
  }[];
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  type?: 'info' | 'success' | 'warning' | 'error' | string;
  is_read: boolean;
  created_at: string;
}
