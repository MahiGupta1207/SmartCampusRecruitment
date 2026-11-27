import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { Job, Company, Application } from '../../types';
import { Modal } from '../../components/common/Modal';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Building2,
  Eye,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

const BRANCH_OPTIONS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

export const AdminJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Closed'>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    company_id: string;
    role_category: string;
    job_type: Job['job_type'];
    location: string;
    salary_min_lpa: number;
    salary_max_lpa: number;
    deadline: string;
    description: string;
    requirements: string;
    selection_process: string;
    min_cgpa: number;
    max_backlogs: number;
    allowed_branches: string[];
    allowed_batches: number[];
  }>({
    title: '',
    company_id: '',
    role_category: 'Software Engineering',
    job_type: 'Full-time',
    location: 'Bangalore / Hyderabad',
    salary_min_lpa: 12,
    salary_max_lpa: 18,
    deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    description: '',
    requirements: 'Solid analytical problem solving\nData Structures and Algorithms\nGood communication',
    selection_process: 'Round 1: Online Coding Test\nRound 2: Technical Interview\nRound 3: HR Round',
    min_cgpa: 7.0,
    max_backlogs: 0,
    allowed_branches: ['Computer Science & Engineering', 'Information Technology'],
    allowed_batches: [2026, 2027],
  });

  const loadData = async () => {
    const [allJobs, allComps, allApps] = await Promise.all([
      dataService.getJobs(),
      dataService.getCompanies(),
      dataService.getApplications(),
    ]);
    setJobs(allJobs);
    setCompanies(allComps);
    setApplications(allApps);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      company_id: companies[0]?.id || '',
      role_category: 'Software Engineering',
      job_type: 'Full-time',
      location: 'Bangalore, India',
      salary_min_lpa: 12,
      salary_max_lpa: 18,
      deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      description: 'Job drive description and candidate expectations.',
      requirements: 'Strong CS fundamentals\nProficiency in Java or Python\nSystem Design awareness',
      selection_process: 'Round 1: Online Assessment\nRound 2: Technical Round\nRound 3: HR Interview',
      min_cgpa: 7.0,
      max_backlogs: 0,
      allowed_branches: ['Computer Science & Engineering', 'Information Technology'],
      allowed_batches: [2026, 2027],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      company_id: job.company_id,
      role_category: job.role_category,
      job_type: job.job_type,
      location: job.location,
      salary_min_lpa: job.salary_min_lpa,
      salary_max_lpa: job.salary_max_lpa,
      deadline: job.deadline.split('T')[0],
      description: job.description,
      requirements: job.requirements.join('\n'),
      selection_process: job.selection_process.join('\n'),
      min_cgpa: job.eligibility.min_cgpa,
      max_backlogs: job.eligibility.max_backlogs,
      allowed_branches: job.eligibility.allowed_branches,
      allowed_batches: job.eligibility.allowed_batches,
    });
    setIsModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const reqArray = formData.requirements.split('\n').filter((r) => r.trim());
    const selArray = formData.selection_process.split('\n').filter((s) => s.trim());

    await dataService.saveJob({
      id: editingJob ? editingJob.id : undefined,
      title: formData.title,
      company_id: formData.company_id || companies[0]?.id,
      role_category: formData.role_category,
      job_type: formData.job_type,
      location: formData.location,
      salary_min_lpa: Number(formData.salary_min_lpa),
      salary_max_lpa: Number(formData.salary_max_lpa),
      deadline: new Date(formData.deadline).toISOString(),
      description: formData.description,
      requirements: reqArray,
      selection_process: selArray,
      is_active: editingJob ? editingJob.is_active : true,
      eligibility: {
        min_cgpa: Number(formData.min_cgpa),
        max_backlogs: Number(formData.max_backlogs),
        allowed_branches: formData.allowed_branches,
        allowed_batches: formData.allowed_batches,
      },
    });

    setIsModalOpen(false);
    await loadData();
  };

  const handleToggleStatus = async (jobId: string) => {
    await dataService.toggleJobStatus(jobId);
    await loadData();
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job drive?')) {
      await dataService.deleteJob(jobId);
      await loadData();
    }
  };

  const handleBranchToggle = (branch: string) => {
    setFormData((prev) => {
      const exists = prev.allowed_branches.includes(branch);
      return {
        ...prev,
        allowed_branches: exists
          ? prev.allowed_branches.filter((b) => b !== branch)
          : [...prev.allowed_branches, branch],
      };
    });
  };

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      job.title.toLowerCase().includes(q) ||
      (job.company?.name || '').toLowerCase().includes(q) ||
      job.role_category.toLowerCase().includes(q);

    if (!matchesQuery) return false;
    if (statusFilter === 'Active' && !job.is_active) return false;
    if (statusFilter === 'Closed' && job.is_active) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Job Drives Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Publish, edit, and configure campus recruitment drives and eligibility constraints.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Create New Job Opening
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by title, recruiter, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-500">Status:</span>
          {(['All', 'Active', 'Closed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === st
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Job Title & Company</th>
                <th className="px-6 py-4">Role & Type</th>
                <th className="px-6 py-4">Package (CTC)</th>
                <th className="px-6 py-4">Eligibility Rules</th>
                <th className="px-6 py-4">Applicants</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No matching job drives found.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const appsCount = applications.filter((a) => a.job_id === job.id).length;

                  return (
                    <tr key={job.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={job.company?.logo_url}
                            alt={job.company?.name}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-100"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{job.title}</p>
                            <p className="text-slate-500 text-[11px] font-medium">
                              {job.company?.name} • {job.location}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700">{job.role_category}</span>
                        <p className="text-slate-400 text-[11px]">{job.job_type}</p>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-indigo-600">
                          ₹{job.salary_min_lpa} - ₹{job.salary_max_lpa} LPA
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-slate-600 text-[11px]">
                          <p>Min CGPA: <strong>{job.eligibility.min_cgpa}</strong></p>
                          <p>Max Backlogs: <strong>{job.eligibility.max_backlogs}</strong></p>
                          <p className="text-slate-400">
                            {job.eligibility.allowed_branches.length} branches permitted
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
                          {appsCount} candidates
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {job.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5" /> Closed
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(job.id)}
                            title={job.is_active ? 'Close Drive' : 'Reactivate Drive'}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                          >
                            {job.is_active ? (
                              <ToggleRight className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(job)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Edit Drive"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Delete Drive"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Create / Edit Job Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingJob ? 'Edit Campus Recruitment Drive' : 'Create New Campus Recruitment Opening'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveJob} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recruiting Company *
              </label>
              <select
                required
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Job Position Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SDE-1 / Cloud Engineer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Role Category *
              </label>
              <select
                value={formData.role_category}
                onChange={(e) => setFormData({ ...formData, role_category: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option>Software Engineering</option>
                <option>Cloud & DevOps</option>
                <option>Cybersecurity</option>
                <option>Frontend Engineering</option>
                <option>Data & Analytics</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Employment Type *
              </label>
              <select
                value={formData.job_type}
                onChange={(e) => setFormData({ ...formData, job_type: e.target.value as any })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Intern + PPO">Intern + PPO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Min CTC (LPA) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.salary_min_lpa}
                onChange={(e) => setFormData({ ...formData, salary_min_lpa: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max CTC (LPA) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.salary_max_lpa}
                onChange={(e) => setFormData({ ...formData, salary_max_lpa: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Posting Location *
              </label>
              <input
                type="text"
                required
                placeholder="Bangalore / Hyderabad / Pan India"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Application Deadline *
              </label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Eligibility Criteria Section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Automated Eligibility Constraints
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Minimum Required CGPA *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={formData.min_cgpa}
                  onChange={(e) => setFormData({ ...formData, min_cgpa: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Maximum Permissible Backlogs *
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  required
                  value={formData.max_backlogs}
                  onChange={(e) => setFormData({ ...formData, max_backlogs: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Eligible Engineering Branches *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {BRANCH_OPTIONS.map((branch) => (
                  <label key={branch} className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowed_branches.includes(branch)}
                      onChange={() => handleBranchToggle(branch)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{branch}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Job Description
            </label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Key Requirements (One per line)
            </label>
            <textarea
              rows={3}
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              {editingJob ? 'Save Drive Updates' : 'Publish Campus Drive'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
