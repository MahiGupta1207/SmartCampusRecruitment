import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { openAccessibleResume } from '../../lib/supabase';
import { StudentProfile, Application } from '../../types';
import { Modal } from '../../components/common/Modal';
import {
  Search,
  ExternalLink,
  Phone,
  Linkedin,
  Github,
  CheckCircle2,
  FileText,
  UserPlus,
  AlertCircle,
} from 'lucide-react';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<(StudentProfile & { full_name: string; email: string })[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [placedFilter, setPlacedFilter] = useState<'All' | 'Placed' | 'Unplaced'>('All');

  // Dossier Modal
  const [selectedStudent, setSelectedStudent] = useState<(StudentProfile & { full_name: string; email: string }) | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Register Student Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [newStudentForm, setNewStudentForm] = useState({
    full_name: '',
    email: '',
    password: '',
    enrollment_no: '',
    branch: 'Computer Science & Engineering',
    graduation_year: 2027,
    cgpa: 8.0,
    backlogs: 0,
    phone: '',
  });

  const loadStudents = async () => {
    const [allStudents, allApps] = await Promise.all([
      dataService.getStudents(),
      dataService.getApplications(),
    ]);
    setStudents(allStudents);
    setApplications(allApps);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleOpenDossier = (st: StudentProfile & { full_name: string; email: string }) => {
    setSelectedStudent(st);
    setIsDossierOpen(true);
  };

  const handleOpenAddModal = () => {
    setAddError('');
    setAddSuccess('');
    setNewStudentForm({
      full_name: '',
      email: '',
      password: '',
      enrollment_no: '',
      branch: 'Computer Science & Engineering',
      graduation_year: 2027,
      cgpa: 8.0,
      backlogs: 0,
      phone: '',
    });
    setIsAddModalOpen(true);
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    setIsRegistering(true);

    const res = await dataService.adminRegisterStudent(newStudentForm);
    setIsRegistering(false);

    if (res.success) {
      setAddSuccess(res.message || 'Student registered successfully!');
      await loadStudents();
      setTimeout(() => {
        setIsAddModalOpen(false);
      }, 1500);
    } else {
      setAddError(res.error || 'Failed to register student.');
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.full_name.toLowerCase().includes(q) ||
      s.enrollment_no.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (branchFilter !== 'All' && s.branch !== branchFilter) return false;
    if (placedFilter === 'Placed' && !s.is_placed) return false;
    if (placedFilter === 'Unplaced' && s.is_placed) return false;

    return true;
  });

  const getStudentApps = (studentId: string) => {
    return applications.filter((a) => a.student_id === studentId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Registered Student Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitor academic profiles, placement records, and candidate dossiers across departments.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Register Student
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search candidate name, enrollment no, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="All">All Engineering Branches</option>
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics & Communication">Electronics & Communication</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
            </select>
          </div>

          <div>
            <select
              value={placedFilter}
              onChange={(e) => setPlacedFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="All">All Placement Statuses</option>
              <option value="Placed">Placed Students</option>
              <option value="Unplaced">Unplaced Students</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium pt-2 border-t border-slate-100 flex items-center justify-between">
          <span>Showing {filteredStudents.length} of {students.length} enrolled students</span>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Student & Roll No.</th>
                <th className="px-6 py-4">Branch & Batch</th>
                <th className="px-6 py-4">CGPA & Backlogs</th>
                <th className="px-6 py-4">Key Skills</th>
                <th className="px-6 py-4">Placement Status</th>
                <th className="px-6 py-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No matching student records found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{st.full_name}</p>
                        <p className="text-slate-500 text-[11px] font-medium">
                          {st.enrollment_no} • {st.email}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700">{st.branch}</span>
                      <p className="text-slate-400 text-[11px]">Class of {st.graduation_year}</p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-[11px]">
                        <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {st.cgpa} CGPA
                        </span>
                        <p className="text-slate-400 mt-0.5">
                          {st.backlogs === 0 ? '0 Backlogs' : `${st.backlogs} Backlogs`}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {st.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {st.skills.length > 3 && (
                          <span className="text-[10px] text-slate-400">+{st.skills.length - 3}</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {st.is_placed ? (
                        <div className="inline-flex flex-col">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Placed
                          </span>
                          <span className="text-[10px] text-slate-600 font-semibold mt-0.5">
                            {st.current_company} (₹{st.package_lpa} LPA)
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                          Available for Hire
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDossier(st)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition"
                      >
                        View Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Dossier Modal */}
      {selectedStudent && (
        <Modal
          isOpen={isDossierOpen}
          onClose={() => setIsDossierOpen(false)}
          title={`Candidate Academic Dossier - ${selectedStudent.full_name}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Header coordinates */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">{selectedStudent.full_name}</h4>
                <p className="text-xs text-slate-500">
                  {selectedStudent.enrollment_no} • {selectedStudent.email}
                </p>
                {selectedStudent.phone && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5" /> {selectedStudent.phone}
                  </p>
                )}
              </div>

              {selectedStudent.is_placed ? (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold text-right">
                  <p>🎉 Placed at {selectedStudent.current_company}</p>
                  <p className="text-sm font-extrabold text-emerald-800">
                    ₹{selectedStudent.package_lpa} LPA
                  </p>
                </div>
              ) : (
                <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-3 py-1 rounded-full">
                  Currently Unplaced
                </span>
              )}
            </div>

            {/* Academic stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                <p className="text-slate-400 font-medium">CGPA</p>
                <p className="text-lg font-extrabold text-indigo-600 mt-0.5">{selectedStudent.cgpa}</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                <p className="text-slate-400 font-medium">Standing Backlogs</p>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5">{selectedStudent.backlogs}</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                <p className="text-slate-400 font-medium">Graduation Year</p>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5">{selectedStudent.graduation_year}</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                <p className="text-slate-400 font-medium">Applications</p>
                <p className="text-lg font-extrabold text-indigo-600 mt-0.5">
                  {getStudentApps(selectedStudent.id).length}
                </p>
              </div>
            </div>

            {/* Resume and links */}
            <div className="flex flex-wrap gap-3 text-xs font-bold">
              {selectedStudent.resume_url && (
                <button
                  type="button"
                  onClick={() => openAccessibleResume(selectedStudent.resume_url!)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition"
                >
                  <FileText className="w-4 h-4" /> Download Resume / CV <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
              {selectedStudent.linkedin_url && (
                <a
                  href={selectedStudent.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 text-sky-700 rounded-xl hover:bg-sky-100 transition"
                >
                  <Linkedin className="w-4 h-4" /> LinkedIn <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {selectedStudent.github_url && (
                <a
                  href={selectedStudent.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-800 rounded-xl hover:bg-slate-200 transition"
                >
                  <Github className="w-4 h-4" /> GitHub <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Technical Skills Portfolio
              </h5>
              <div className="flex flex-wrap gap-2">
                {selectedStudent.skills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio */}
            {selectedStudent.bio && (
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Bio / Summary</h5>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedStudent.bio}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDossierOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Register Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Student"
        maxWidth="xl"
      >
        <form onSubmit={handleRegisterStudent} className="space-y-4">
          {addError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          {addSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{addSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Aarav Patel"
                value={newStudentForm.full_name}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, full_name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Institutional Email *</label>
              <input
                type="email"
                required
                placeholder="student@campus.edu"
                value={newStudentForm.email}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enrollment / Roll No. *</label>
              <input
                type="text"
                required
                placeholder="e.g. 2023CS01099"
                value={newStudentForm.enrollment_no}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, enrollment_no: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password *</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={newStudentForm.password}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, password: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Branch *</label>
              <select
                value={newStudentForm.branch}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, branch: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option>Computer Science & Engineering</option>
                <option>Information Technology</option>
                <option>Electronics & Communication</option>
                <option>Electrical Engineering</option>
                <option>Mechanical Engineering</option>
                <option>Civil Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Graduation Year *</label>
              <select
                value={newStudentForm.graduation_year}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, graduation_year: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CGPA (0 - 10) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                value={newStudentForm.cgpa}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, cgpa: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Active Backlogs</label>
              <input
                type="number"
                min="0"
                max="15"
                value={newStudentForm.backlogs}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, backlogs: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={newStudentForm.phone}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRegistering}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {isRegistering ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Register Student
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
