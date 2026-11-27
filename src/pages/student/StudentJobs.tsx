import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { Job, Application, EligibilityResult } from '../../types';
import { Modal } from '../../components/common/Modal';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Send,
  Building2,
} from 'lucide-react';

export const StudentJobs: React.FC = () => {
  const { studentProfile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState<'all' | 'eligible' | 'ineligible'>('all');

  // Modal State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [allJobs, allApps] = await Promise.all([
      dataService.getJobs(),
      studentProfile ? dataService.getStudentApplications(studentProfile.id) : [],
    ]);
    setJobs(allJobs);
    setApplications(allApps);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [studentProfile]);

  // Check if current student applied to a specific job
  const hasApplied = (jobId: string) => {
    return applications.some((a) => a.job_id === jobId);
  };

  // Eligibility helper
  const getEligibility = (job: Job): EligibilityResult => {
    return dataService.checkEligibility(studentProfile, job);
  };

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    // Search match
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      job.title.toLowerCase().includes(q) ||
      (job.company?.name || '').toLowerCase().includes(q) ||
      job.role_category.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // Role filter
    if (selectedRole !== 'All' && job.role_category !== selectedRole) return false;

    // Type filter
    if (selectedType !== 'All' && job.job_type !== selectedType) return false;

    // Eligibility filter
    const el = getEligibility(job);
    if (eligibilityFilter === 'eligible' && !el.isEligible) return false;
    if (eligibilityFilter === 'ineligible' && el.isEligible) return false;

    return true;
  });

  const handleOpenJob = (job: Job) => {
    setSelectedJob(job);
    setApplyFeedback(null);
    setIsModalOpen(true);
  };

  const handleApply = async () => {
    if (!selectedJob || !studentProfile) return;

    setIsApplying(true);
    setApplyFeedback(null);

    const result = await dataService.applyToJob(studentProfile, selectedJob);
    setIsApplying(false);

    if (result.success) {
      setApplyFeedback({ type: 'success', message: result.message });
      // Refresh applications list
      const updatedApps = await dataService.getStudentApplications(studentProfile.id);
      setApplications(updatedApps);
    } else {
      setApplyFeedback({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Campus Recruitment Drives
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Browse verified university placement drives, check real-time eligibility, and apply directly.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by job title, company name, skill, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="All">All Role Categories</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Cloud & DevOps">Cloud & DevOps</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Frontend Engineering">Frontend Engineering</option>
              <option value="Data & Analytics">Data & Analytics</option>
            </select>
          </div>

          {/* Job Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="All">All Job Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Internship">Internship</option>
              <option value="Intern + PPO">Intern + PPO</option>
            </select>
          </div>
        </div>

        {/* Eligibility Quick Toggle Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter by My Eligibility:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setEligibilityFilter('all')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  eligibilityFilter === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                All ({jobs.length})
              </button>
              <button
                onClick={() => setEligibilityFilter('eligible')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  eligibilityFilter === 'eligible'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Eligible Only
              </button>
              <button
                onClick={() => setEligibilityFilter('ineligible')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  eligibilityFilter === 'ineligible'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Ineligible
              </button>
            </div>
          </div>

          <span className="text-slate-400 font-medium">
            Showing {filteredJobs.length} of {jobs.length} drives
          </span>
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No matching campus drives found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, role filter, or eligibility criteria toggle.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const el = getEligibility(job);
            const applied = hasApplied(job.id);

            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition group"
              >
                <div className="space-y-4">
                  {/* Top Bar: Company info & Applied / Status badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={job.company?.logo_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=64'}
                        alt={job.company?.name}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-100"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-500">{job.company?.name}</span>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                          {job.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Compensation & Type Pills */}
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700">
                      ₹{job.salary_min_lpa} - ₹{job.salary_max_lpa} LPA
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                      {job.job_type}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {job.location.split('/')[0].trim()}
                    </span>
                  </div>

                  {/* Eligibility Indicator Pill */}
                  <div>
                    {el.isEligible ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>You meet all eligibility criteria</span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                        <XCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{el.reasons[0]}</span>
                      </div>
                    )}
                  </div>

                  {/* Requirements Preview */}
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-700">Eligibility rules:</p>
                    <p className="text-slate-500">
                      Min CGPA: <strong className="text-slate-700">{job.eligibility.min_cgpa}</strong> • Max Backlogs:{' '}
                      <strong className="text-slate-700">{job.eligibility.max_backlogs}</strong>
                    </p>
                  </div>
                </div>

                {/* Bottom Bar: Deadline & Apply Button */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(job.deadline).toLocaleDateString()}
                  </span>

                  {applied ? (
                    <button
                      onClick={() => handleOpenJob(job)}
                      className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-lg hover:bg-emerald-100 transition"
                    >
                      Applied ✓
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenJob(job)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs transition"
                    >
                      View & Apply <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Job & Application Modal */}
      {selectedJob && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedJob.title}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Company & Role Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <img
                src={selectedJob.company?.logo_url}
                alt={selectedJob.company?.name}
                className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200"
              />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">{selectedJob.company?.name}</h4>
                <p className="text-xs text-slate-500">{selectedJob.company?.industry}</p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold pt-1">
                  <span className="text-indigo-600 font-bold">
                    ₹{selectedJob.salary_min_lpa} - ₹{selectedJob.salary_max_lpa} LPA
                  </span>
                  <span>•</span>
                  <span className="text-slate-600">{selectedJob.job_type}</span>
                  <span>•</span>
                  <span className="text-slate-600">{selectedJob.location}</span>
                </div>
              </div>
            </div>

            {/* Application Feedback Banner if just applied */}
            {applyFeedback && (
              <div
                className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  applyFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {applyFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{applyFeedback.message}</span>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Role Description
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedJob.description}</p>
            </div>

            {/* Key Technical Requirements */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Candidate Requirements
              </h5>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
                {selectedJob.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>

            {/* Selection Rounds */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Hiring & Selection Rounds
              </h5>
              <div className="space-y-1.5">
                {selectedJob.selection_process.map((round, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium flex items-center gap-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{round}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Eligibility Evaluation Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Your Eligibility Evaluation
              </h5>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Min CGPA Required:</span>{' '}
                  <strong className="text-slate-800">{selectedJob.eligibility.min_cgpa}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Your Current CGPA:</span>{' '}
                  <strong className="text-indigo-600">{studentProfile?.cgpa || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Max Backlogs Allowed:</span>{' '}
                  <strong className="text-slate-800">{selectedJob.eligibility.max_backlogs}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Your Active Backlogs:</span>{' '}
                  <strong className="text-slate-800">{studentProfile?.backlogs ?? 0}</strong>
                </div>
              </div>

              {/* Status outcome */}
              {(() => {
                const el = getEligibility(selectedJob);
                if (el.isEligible) {
                  return (
                    <div className="p-2.5 rounded-lg bg-emerald-100/70 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Congratulations! You meet all academic criteria to apply for this position.</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-600" /> You are currently ineligible for this drive:
                      </p>
                      <ul className="list-disc pl-5 text-rose-700 text-[11px] space-y-0.5">
                        {el.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Apply Action Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close
              </button>

              {hasApplied(selectedJob.id) ? (
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Application Already Submitted
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!getEligibility(selectedJob).isEligible || isApplying}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isApplying ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Confirm & Submit Application
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
