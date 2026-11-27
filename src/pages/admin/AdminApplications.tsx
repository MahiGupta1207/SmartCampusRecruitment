import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { openAccessibleResume } from '../../lib/supabase';
import { Application, Job, ApplicationStatus } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  FileCheck2,
  Search,
  Filter,
  Download,
  Calendar,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  Layers,
} from 'lucide-react';

export const AdminApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Status Update Modal State
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('Under Review');
  const [statusNotes, setStatusNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');

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

  const handleOpenUpdateModal = (app: Application) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setStatusNotes(app.notes || '');
    setInterviewDate(app.interview_date ? app.interview_date.split('T')[0] : '');
    setIsUpdateModalOpen(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    await dataService.updateApplicationStatus(
      selectedApp.id,
      newStatus,
      statusNotes,
      interviewDate ? new Date(interviewDate).toISOString() : undefined
    );

    setIsUpdateModalOpen(false);
    await loadData();
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
    // Search match
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

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Application Pipeline & Review
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Review student applications, schedule technical interviews, and roll out selection offers.
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search candidate name, enrollment, or role..."
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
        </div>

        <div className="text-xs text-slate-500 font-medium pt-2 border-t border-slate-100 flex items-center justify-between">
          <span>Showing {filteredApplications.length} of {applications.length} submitted applications</span>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Applicant Candidate</th>
                <th className="px-6 py-4">Applied Job & Company</th>
                <th className="px-6 py-4">Academic Merit</th>
                <th className="px-6 py-4">Resume</th>
                <th className="px-6 py-4">Applied Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No matching applications found.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {app.student?.full_name || 'Candidate'}
                        </p>
                        <p className="text-slate-500 text-[11px] font-medium">
                          {app.student?.enrollment_no} • {app.student?.branch?.replace(' Engineering', '')}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-800">{app.job?.title}</p>
                        <p className="text-slate-500 text-[11px]">{app.job?.company?.name}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-[11px]">
                        <p className="font-bold text-slate-800">CGPA: {app.student?.cgpa || 'N/A'}</p>
                        <p className="text-slate-400">Backlogs: {app.student?.backlogs ?? 0}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
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

                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenUpdateModal(app)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition"
                      >
                        Action / Move
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                <option value="Selected">Selected / Rollout Offer</option>
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
                  Selecting this candidate will automatically mark their profile as <strong>Placed</strong> with this company and update placement analytics.
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
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Save & Update Candidate
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
