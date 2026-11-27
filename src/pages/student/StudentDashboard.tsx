import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { Job, Application } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import {
  Briefcase,
  FileCheck2,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Clock,
  Building2,
  PartyPopper,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { studentProfile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [eligibleJobsCount, setEligibleJobsCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const allJobs = await dataService.getJobs();
      setJobs(allJobs);

      if (studentProfile) {
        const studentApps = await dataService.getStudentApplications(studentProfile.id);
        setApplications(studentApps);

        // Count eligible active jobs
        let count = 0;
        allJobs.forEach((j) => {
          if (j.is_active && dataService.checkEligibility(studentProfile, j).isEligible) {
            count++;
          }
        });
        setEligibleJobsCount(count);
      }
    };

    fetchData();
  }, [studentProfile]);

  // Profile completion score
  const calculateProfileCompletion = () => {
    if (!studentProfile) return 40;
    let score = 0;
    if (studentProfile.full_name) score += 15;
    if (studentProfile.enrollment_no) score += 15;
    if (studentProfile.phone) score += 10;
    if (studentProfile.cgpa) score += 15;
    if (studentProfile.skills && studentProfile.skills.length > 0) score += 15;
    if (studentProfile.resume_url) score += 20;
    if (studentProfile.linkedin_url || studentProfile.github_url) score += 10;
    return Math.min(100, score);
  };

  const profileScore = calculateProfileCompletion();

  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted').length;
  const interviewCount = applications.filter((a) => a.status === 'Interview Scheduled').length;
  const selectedCount = applications.filter((a) => a.status === 'Selected').length;
  const pendingOffers = applications.filter((a) => a.offer_status === 'Pending');
  const acceptedOffersCount = applications.filter((a) => a.offer_status === 'Accepted').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Pending Offer Alert Banner */}
      {pendingOffers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                You have {pendingOffers.length} Pending Job Offer{pendingOffers.length > 1 ? 's' : ''}!
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                {pendingOffers[0].job?.company?.name} ({pendingOffers[0].job?.title}
                {pendingOffers[0].offer_package_lpa !== undefined
                  ? ` — ₹${pendingOffers[0].offer_package_lpa} LPA`
                  : ''}
                ) is awaiting your response.
              </p>
            </div>
          </div>
          <Link
            to="/student/applications"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition whitespace-nowrap text-center"
          >
            Review &amp; Respond to Offer
          </Link>
        </div>
      )}

      {/* Placed Celebration Banner if Placed */}
      {studentProfile?.is_placed && (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <PartyPopper className="w-9 h-9 text-amber-300 animate-bounce" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
                  Placement Offer Secured
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Congratulations, {studentProfile.full_name}!
                </h2>
                <p className="text-emerald-100 text-sm">
                  You have secured an official placement offer at{' '}
                  <strong className="text-white underline">
                    {studentProfile.current_company || 'Top Recruiter'}
                  </strong>{' '}
                  {studentProfile.package_lpa && (
                    <span>with a package of ₹{studentProfile.package_lpa} LPA</span>
                  )}
                  .
                </p>
              </div>
            </div>
            <Link
              to="/student/applications"
              className="px-5 py-2.5 bg-white text-emerald-800 font-bold rounded-xl text-xs hover:bg-emerald-50 transition shadow-sm whitespace-nowrap"
            >
              View Offer Details
            </Link>
          </div>
        </div>
      )}

      {/* Welcome & Profile Summary Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Student Placement Portal
          </h1>
          <p className="text-xs text-slate-500">
            Welcome back, <span className="font-bold text-slate-800">{studentProfile?.full_name}</span> (
            {studentProfile?.branch} • CGPA: {studentProfile?.cgpa})
          </p>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex flex-col text-right w-full sm:w-48">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-500">Profile Readiness</span>
              <span className="text-indigo-600 font-bold">{profileScore}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${profileScore}%` }}
              />
            </div>
          </div>
          <Link
            to="/student/profile"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition whitespace-nowrap"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Eligible Jobs
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{eligibleJobsCount}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Based on your CGPA & Branch
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Applications
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{applications.length}</p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            Submitted this recruitment drive
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Interviews
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{interviewCount}</p>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">
            {interviewCount > 0 ? 'Interview schedules active' : 'No upcoming schedules'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Offers Received
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{selectedCount}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {acceptedOffersCount > 0
              ? `${acceptedOffersCount} accepted`
              : pendingOffers.length > 0
                ? `${pendingOffers.length} pending response`
                : selectedCount > 0
                  ? 'Selected for offer'
                  : 'Under evaluation'}
          </p>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: My Active Applications & Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recent Applications</h3>
                <p className="text-xs text-slate-500">Track status across company hiring pipelines</p>
              </div>
              <Link
                to="/student/applications"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No applications submitted yet</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Explore open campus drives matching your branch and apply.
                </p>
                <Link
                  to="/student/jobs"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Browse Eligible Jobs
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {applications.slice(0, 4).map((app) => (
                  <div key={app.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={app.job?.company?.logo_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=64'}
                        alt={app.job?.company?.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-100"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{app.job?.title}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{app.job?.company?.name}</span>
                          <span>•</span>
                          <span>Applied on {new Date(app.applied_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={app.status} />
                      {app.interview_date && (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          Interview: {new Date(app.interview_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Eligible Opportunities Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recommended for You</h3>
                <p className="text-xs text-slate-500">Drives where you meet all eligibility requirements</p>
              </div>
              <Link
                to="/student/jobs"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                View Marketplace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobs
                .filter((j) => studentProfile && dataService.checkEligibility(studentProfile, j).isEligible)
                .slice(0, 2)
                .map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition bg-slate-50/50 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <img
                          src={job.company?.logo_url}
                          alt={job.company?.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <span className="text-xs font-bold text-slate-600">{job.company?.name}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{job.title}</h4>
                      <p className="text-xs font-semibold text-indigo-600 mt-1">
                        ₹{job.salary_min_lpa} - ₹{job.salary_max_lpa} LPA • {job.job_type}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                      </span>
                      <Link
                        to="/student/jobs"
                        className="font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        Apply Now
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column: Deadlines, Checklists, Notice Board */}
        <div className="space-y-6">
          {/* Profile Completion Checklist */}
          {profileScore < 100 && (
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-6 rounded-2xl border border-indigo-100 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-600" />
                Improve Profile Visibility
              </h3>
              <p className="text-xs text-indigo-800/80 leading-relaxed">
                Recruiters filter candidates by verified skills and updated resume links. Complete your missing items:
              </p>
              <ul className="text-xs space-y-1.5 font-medium text-indigo-900">
                {!studentProfile?.resume_url && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Upload / attach your resume URL
                  </li>
                )}
                {(!studentProfile?.skills || studentProfile.skills.length < 3) && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Add at least 3 core technical skills
                  </li>
                )}
                {!studentProfile?.phone && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Provide contact phone number
                  </li>
                )}
              </ul>
              <Link
                to="/student/profile"
                className="inline-block mt-2 text-xs font-bold text-indigo-700 hover:text-indigo-900 underline"
              >
                Complete Profile Now →
              </Link>
            </div>
          )}

          {/* Upcoming Drive Deadlines */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Upcoming Application Deadlines
            </h3>
            <div className="space-y-3">
              {jobs.slice(0, 3).map((j) => (
                <div key={j.id} className="text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <p className="font-bold text-slate-800">{j.title}</p>
                  <div className="flex items-center justify-between text-slate-500 mt-1">
                    <span>{j.company?.name}</span>
                    <span className="text-rose-600 font-semibold">
                      {new Date(j.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Placement Cell Notice Board */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              T&P Notice Board
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <p className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                📢 <strong>Mock OA Practice:</strong> Coding assessment sandbox will open this Friday at 6:00 PM for all registered CSE & IT students.
              </p>
              <p className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                📄 <strong>Resume Verification:</strong> Final date for resume approval with department coordinators is approaching.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
