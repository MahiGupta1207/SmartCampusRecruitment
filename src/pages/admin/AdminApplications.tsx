import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { openAccessibleResume } from '../../lib/supabase';
import { Application, Job, ApplicationStatus } from '../../types';
import { StatusBadge, OfferStatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Search,
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Award,
  UserCheck,
  History,
  Linkedin,
  Github,
  Globe,
} from 'lucide-react';

export const AdminApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedOfferFilter, setSelectedOfferFilter] = useState<string>('All');

  // Action feedback
  const [busyAppId, setBusyAppId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Status Update Modal State
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('Under Review');
  const [statusNotes, setStatusNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');

  // Candidate Review Modal State
  const [reviewApp, setReviewApp] = useState<Application | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Issue Offer Modal State
  const [offerApp, setOfferApp] = useState<Application | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerPackageLpa, setOfferPackageLpa] = useState<string>('');
  const [offerDate, setOfferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [offerDetails, setOfferDetails] = useState<string>('');

  const loadData = async () => {
    const [allApps, allJobs] = await Promise.all([
      dataService.getApplications(),
      dataService.getJobs(),
    ]);
    setApplications(allApps);
    setJobs(allJobs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickStatusChange = async (
    app: Application,
    targetStatus: ApplicationStatus,
    defaultNote: string
  ) => {
    setFeedback(null);
    setBusyAppId(app.id);
    try {
      await dataService.updateApplicationStatus(app.id, targetStatus, defaultNote);
      await loadData();
      setFeedback({
        type: 'success',
        text: `${app.student?.full_name || 'Candidate'} marked as ${targetStatus}.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || `Failed to update status to ${targetStatus}.`,
      });
    } finally {
      setBusyAppId(null);
    }
  };

  const handleOpenUpdateModal = (app: Application, presetStatus?: ApplicationStatus) => {
    setSelectedApp(app);
    setNewStatus(presetStatus || app.status);
    setStatusNotes(app.notes || '');
    setInterviewDate(app.interview_date ? app.interview_date.split('T')[0] : '');
    setIsUpdateModalOpen(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setFeedback(null);
    setBusyAppId(selectedApp.id);

    try {
      await dataService.updateApplicationStatus(
        selectedApp.id,
        newStatus,
        statusNotes,
        interviewDate ? new Date(interviewDate).toISOString() : undefined
      );
      setIsUpdateModalOpen(false);
      await loadData();
      setFeedback({
        type: 'success',
        text: `Updated ${selectedApp.student?.full_name || 'candidate'} to ${newStatus}.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to update application status.',
      });
    } finally {
      setBusyAppId(null);
    }
  };

  const handleOpenReviewModal = (app: Application) => {
    setReviewApp(app);
    setIsReviewModalOpen(true);
  };

  const handleOpenOfferModal = (app: Application) => {
    setOfferApp(app);
    const defaultPkg =
      app.offer_package_lpa ??
      app.job?.salary_max_lpa ??
      app.job?.salary_min_lpa ??
      0;
    setOfferPackageLpa(String(defaultPkg));
    setOfferDate(app.offer_date || new Date().toISOString().split('T')[0]);
    setOfferDetails(
      app.offer_details ||
        `Full-time offer for ${app.job?.title || 'Role'} at ${app.job?.company?.name || 'Company'} (${app.job?.location || 'India'}).`
    );
    setIsOfferModalOpen(true);
  };

  const handleIssueOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerApp) return;
    setFeedback(null);
    setBusyAppId(offerApp.id);

    const pkg = parseFloat(offerPackageLpa);
    const res = await dataService.issueOffer(offerApp.id, {
      packageLpa: pkg,
      offerDate,
      details: offerDetails,
    });

    setBusyAppId(null);
    if (res.success) {
      setIsOfferModalOpen(false);
      await loadData();
      setFeedback({
        type: 'success',
        text: `Official offer issued to ${offerApp.student?.full_name || 'candidate'} (₹${pkg} LPA).`,
      });
    } else {
      setFeedback({
        type: 'error',
        text: res.message || 'Could not issue offer.',
      });
    }
  };

  const handleExportCSV = () => {
    const csvContent = dataService.generateApplicationsCSV(filteredApplications);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Applications_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredApplications = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    const candidateName = app.student?.full_name?.toLowerCase() || '';
    const enrollment = app.student?.enrollment_no?.toLowerCase() || '';
    const company = app.job?.company?.name?.toLowerCase() || '';
    const title = app.job?.title?.toLowerCase() || '';

    const matchesSearch =
      candidateName.includes(q) ||
      enrollment.includes(q) ||
      company.includes(q) ||
      title.includes(q);

    if (!matchesSearch) return false;
    if (selectedJobId !== 'All' && app.job_id !== selectedJobId) return false;
    if (selectedStatus !== 'All' && app.status !== selectedStatus) return false;
    if (selectedOfferFilter === 'Not Issued' && app.offer_status) return false;
    if (
      selectedOfferFilter !== 'All' &&
      selectedOfferFilter !== 'Not Issued' &&
      app.offer_status !== selectedOfferFilter
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Application Pipeline & Offer Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Review student profiles, shortlist or reject applications, and issue official placement offers.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          <Download className="w-4 h-4" />
          Export Applications CSV
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search candidate, enrollment, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="All">All Job Drives</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.company?.name} - {j.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="All">All Pipeline Stages</option>
              <option value="Applied">Applied</option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <select
              value={selectedOfferFilter}
              onChange={(e) => setSelectedOfferFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="All">All Offer Statuses</option>
              <option value="Pending">Offer: Pending</option>
              <option value="Accepted">Offer: Accepted</option>
              <option value="Declined">Offer: Declined</option>
              <option value="Not Issued">Offer Not Issued</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <span>Showing {filteredApplications.length} of {applications.length} submitted applications</span>
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="font-semibold text-indigo-600">
              Shortlisted: {applications.filter((a) => a.status === 'Shortlisted').length}
            </span>
            <span className="font-semibold text-emerald-600">
              Selected: {applications.filter((a) => a.status === 'Selected').length}
            </span>
            <span className="font-semibold text-amber-600">
              Offers Pending: {applications.filter((a) => a.offer_status === 'Pending').length}
            </span>
            <span className="font-semibold text-teal-700">
              Offers Accepted: {applications.filter((a) => a.offer_status === 'Accepted').length}
            </span>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-4">Applicant Candidate</th>
                <th className="px-5 py-4">Applied Job & Company</th>
                <th className="px-5 py-4">Academic Merit</th>
                <th className="px-5 py-4">Resume</th>
                <th className="px-5 py-4">Status & Offer</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No matching applications found.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => {
                  const isBusy = busyAppId === app.id;
                  const canShortlist =
                    app.status === 'Applied' || app.status === 'Under Review';
                  const canSelect =
                    app.status !== 'Selected' && app.status !== 'Rejected';
                  const canReject =
                    app.status !== 'Rejected' && app.offer_status !== 'Accepted';

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {app.student?.full_name || 'Candidate'}
                          </p>
                          <p className="text-slate-500 text-[11px] font-medium">
                            {app.student?.enrollment_no} •{' '}
                            {app.student?.branch?.replace(' Engineering', '')}
                          </p>
                          <p className="text-slate-400 text-[10px]">
                            Applied {new Date(app.applied_at).toLocaleDateString()}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold text-slate-800">{app.job?.title}</p>
                          <p className="text-slate-500 text-[11px]">{app.job?.company?.name}</p>
                          <p className="text-slate-400 text-[10px]">
                            ₹{app.job?.salary_min_lpa}–{app.job?.salary_max_lpa} LPA
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-[11px]">
                          <p className="font-bold text-slate-800">
                            CGPA: {app.student?.cgpa || 'N/A'}
                          </p>
                          <p className="text-slate-400">
                            Backlogs: {app.student?.backlogs ?? 0}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {app.student?.resume_url ? (
                          <button
                            type="button"
                            onClick={() => openAccessibleResume(app.student!.resume_url!)}
                            className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            View CV <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-slate-400">Not uploaded</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <StatusBadge status={app.status} />
                          {app.offer_status && (
                            <div className="flex flex-col gap-0.5">
                              <OfferStatusBadge status={app.offer_status} />
                              {app.offer_package_lpa !== undefined && (
                                <span className="text-[10px] font-semibold text-slate-500">
                                  ₹{app.offer_package_lpa} LPA
                                  {app.offer_date ? ` • ${app.offer_date}` : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(app)}
                            title="Review Candidate Profile & History"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </button>

                          {canShortlist && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleQuickStatusChange(
                                  app,
                                  'Shortlisted',
                                  'Shortlisted by Placement Officer for further rounds.'
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg transition disabled:opacity-50"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Shortlist
                            </button>
                          )}

                          {canSelect && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleQuickStatusChange(
                                  app,
                                  'Selected',
                                  'Selected by Placement Officer / Recruiter.'
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Select
                            </button>
                          )}

                          {app.status === 'Selected' && (
                            <button
                              type="button"
                              disabled={isBusy || app.offer_status === 'Accepted'}
                              onClick={() => handleOpenOfferModal(app)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg transition disabled:opacity-50"
                            >
                              <Award className="w-3.5 h-3.5" />
                              {app.offer_status ? 'Update Offer' : 'Issue Offer'}
                            </button>
                          )}

                          {canReject && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleOpenUpdateModal(app, 'Rejected')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenUpdateModal(app)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition"
                          >
                            Stage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Profile & Application Review Modal */}
      {reviewApp && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title={`Candidate Review — ${reviewApp.student?.full_name || 'Applicant'}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {reviewApp.student?.full_name}
                </h4>
                <p className="text-slate-500 mt-0.5">
                  {reviewApp.student?.email} • {reviewApp.student?.phone || 'No phone'}
                </p>
                <p className="text-slate-600 font-semibold mt-1">
                  {reviewApp.student?.enrollment_no} • {reviewApp.student?.branch} (Batch{' '}
                  {reviewApp.student?.graduation_year})
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1.5">
                <StatusBadge status={reviewApp.status} />
                {reviewApp.offer_status && <OfferStatusBadge status={reviewApp.offer_status} />}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase">CGPA</span>
                <p className="text-base font-extrabold text-slate-900">
                  {reviewApp.student?.cgpa ?? 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Backlogs</span>
                <p className="text-base font-extrabold text-slate-900">
                  {reviewApp.student?.backlogs ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-white col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Applied Drive</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {reviewApp.job?.title} — {reviewApp.job?.company?.name}
                </p>
              </div>
            </div>

            {reviewApp.student?.bio && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Candidate Bio
                </span>
                <p className="text-slate-700 leading-relaxed">{reviewApp.student.bio}</p>
              </div>
            )}

            {reviewApp.student?.skills && reviewApp.student.skills.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                  Verified Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {reviewApp.student.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-[11px]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {reviewApp.student?.resume_url && (
                <button
                  type="button"
                  onClick={() => openAccessibleResume(reviewApp.student!.resume_url!)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
                >
                  Open Resume / CV <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
              {reviewApp.student?.linkedin_url && (
                <a
                  href={reviewApp.student.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                </a>
              )}
              {reviewApp.student?.github_url && (
                <a
                  href={reviewApp.student.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  <Github className="w-3.5 h-3.5" /> GitHub
                </a>
              )}
              {reviewApp.student?.portfolio_url && (
                <a
                  href={reviewApp.student.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  <Globe className="w-3.5 h-3.5" /> Portfolio
                </a>
              )}
            </div>

            {/* Status History */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-600" />
                Application Timeline
              </h5>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {reviewApp.status_history && reviewApp.status_history.length > 0 ? (
                  reviewApp.status_history.map((h, i) => (
                    <div
                      key={h.id || i}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{h.status}</span>
                        <p className="text-slate-600">{h.notes || 'Status updated'}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">No status history entries yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close
              </button>
              {reviewApp.status === 'Selected' && reviewApp.offer_status !== 'Accepted' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    handleOpenOfferModal(reviewApp);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition"
                >
                  {reviewApp.offer_status ? 'Update Offer' : 'Issue Offer'}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Status Update Modal */}
      {selectedApp && (
        <Modal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          title={`Update Pipeline Stage - ${selectedApp.student?.full_name}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveStatus} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <p>
                Candidate:{' '}
                <strong className="text-slate-800">{selectedApp.student?.full_name}</strong> (
                {selectedApp.student?.enrollment_no})
              </p>
              <p className="mt-0.5">
                Drive:{' '}
                <strong className="text-slate-800">
                  {selectedApp.job?.title} at {selectedApp.job?.company?.name}
                </strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Recruitment Stage *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="Applied">Applied</option>
                <option value="Under Review">Under Review</option>
                <option value="Shortlisted">Shortlisted for Rounds</option>
                <option value="Interview Scheduled">Schedule Technical Interview</option>
                <option value="Selected">Selected (Ready for Offer)</option>
                <option value="Rejected">Not Shortlisted / Rejected</option>
              </select>
            </div>

            {newStatus === 'Interview Scheduled' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Interview Date & Time
                </label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recruiter Remarks / Reason / Meeting Link
              </label>
              <textarea
                rows={3}
                placeholder="Add assessment score, interview instructions, or rejection feedback..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {newStatus === 'Selected' && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  After saving as <strong>Selected</strong>, click <strong>Issue Offer</strong> to send the official package &amp; offer letter details to the student.
                </span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyAppId === selectedApp.id}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
              >
                Save &amp; Update Candidate
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Issue / Update Offer Modal */}
      {offerApp && (
        <Modal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          title={`Issue Official Job Offer — ${offerApp.student?.full_name || 'Candidate'}`}
          maxWidth="md"
        >
          <form onSubmit={handleIssueOfferSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-1">
              <p>
                Company: <strong className="text-slate-900">{offerApp.job?.company?.name}</strong>
              </p>
              <p>
                Job Role: <strong className="text-slate-900">{offerApp.job?.title}</strong>
              </p>
              <p>
                Candidate:{' '}
                <strong className="text-slate-900">
                  {offerApp.student?.full_name} ({offerApp.student?.enrollment_no})
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Offered Package (LPA) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={offerPackageLpa}
                  onChange={(e) => setOfferPackageLpa(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Offer Date *
                </label>
                <input
                  type="date"
                  required
                  value={offerDate}
                  onChange={(e) => setOfferDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Offer Details &amp; Joining Terms
              </label>
              <textarea
                rows={3}
                placeholder="Include joining location, tentative joining date, stipend/CTC breakdown, or acceptance deadline..."
                value={offerDetails}
                onChange={(e) => setOfferDetails(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              Issuing this offer sets its status to <strong>Pending</strong>. The student can review and <strong>Accept</strong> or <strong>Decline</strong> it from their portal.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyAppId === offerApp.id}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
              >
                Send Official Offer
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
