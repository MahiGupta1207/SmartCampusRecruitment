import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  GraduationCap,
  Save,
  CheckCircle2,
  FileText,
  Linkedin,
  Github,
  Globe,
  Plus,
  X,
  AlertCircle,
  ExternalLink,
  Upload,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { uploadResumeToStorage, uploadAvatarToStorage, isSupabaseConfigured } from '../../lib/supabase';

export const StudentProfile: React.FC = () => {
  const { user, studentProfile, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    full_name: studentProfile?.full_name || '',
    email: studentProfile?.email || '',
    phone: studentProfile?.phone || '',
    enrollment_no: studentProfile?.enrollment_no || '',
    branch: studentProfile?.branch || 'Computer Science & Engineering',
    graduation_year: studentProfile?.graduation_year || 2027,
    cgpa: studentProfile?.cgpa ?? 8.0,
    backlogs: studentProfile?.backlogs ?? 0,
    resume_url: studentProfile?.resume_url || '',
    linkedin_url: studentProfile?.linkedin_url || '',
    github_url: studentProfile?.github_url || '',
    portfolio_url: studentProfile?.portfolio_url || '',
    bio: studentProfile?.bio || '',
    skills: studentProfile?.skills || ['Python', 'Problem Solving', 'Data Structures'],
  });

  useEffect(() => {
    if (studentProfile) {
      setFormData({
        full_name: studentProfile.full_name || '',
        email: studentProfile.email || '',
        phone: studentProfile.phone || '',
        enrollment_no: studentProfile.enrollment_no || '',
        branch: studentProfile.branch || 'Computer Science & Engineering',
        graduation_year: studentProfile.graduation_year || 2027,
        cgpa: studentProfile.cgpa ?? 8.0,
        backlogs: studentProfile.backlogs ?? 0,
        resume_url: studentProfile.resume_url || '',
        linkedin_url: studentProfile.linkedin_url || '',
        github_url: studentProfile.github_url || '',
        portfolio_url: studentProfile.portfolio_url || '',
        bio: studentProfile.bio || '',
        skills: studentProfile.skills || [],
      });
    }
  }, [studentProfile]);

  const [newSkill, setNewSkill] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user?.avatar_url) {
      setAvatarUrl(user.avatar_url);
    }
  }, [user?.avatar_url]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = user?.id || studentProfile?.id;
    if (!file || !targetId) return;
    setIsUploadingAvatar(true);
    setErrorMessage('');
    const { url, error } = await uploadAvatarToStorage(file, targetId);
    setIsUploadingAvatar(false);
    if (error) {
      setErrorMessage(`Profile picture upload error: ${error}`);
    } else if (url) {
      setAvatarUrl(url);
      await updateProfile({ avatar_url: url });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !studentProfile) return;
    setIsUploadingResume(true);
    setErrorMessage('');
    const { url, error } = await uploadResumeToStorage(file, studentProfile.id);
    setIsUploadingResume(false);
    if (error) {
      setErrorMessage(`Resume upload error: ${error}`);
    } else if (url) {
      setFormData((prev) => ({ ...prev, resume_url: url }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData({ ...formData, skills: [...formData.skills, trimmed] });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    });
  };

  const isValidHttpUrl = (val: string) => {
    if (!val.trim()) return true;
    try {
      const parsed = new URL(val.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSaveSuccess(false);

    if (!formData.full_name.trim() || !formData.enrollment_no.trim()) {
      setErrorMessage('Full name and enrollment number are required.');
      return;
    }

    if (formData.phone.trim() && !/^[+\d\s()-]{7,20}$/.test(formData.phone.trim())) {
      setErrorMessage('Please enter a valid contact phone number.');
      return;
    }

    if (isNaN(formData.cgpa) || formData.cgpa < 0 || formData.cgpa > 10) {
      setErrorMessage('CGPA must be between 0.00 and 10.00.');
      return;
    }

    if (isNaN(formData.backlogs) || formData.backlogs < 0) {
      setErrorMessage('Backlogs cannot be a negative value.');
      return;
    }

    if (
      !isValidHttpUrl(formData.resume_url) ||
      !isValidHttpUrl(formData.linkedin_url) ||
      !isValidHttpUrl(formData.github_url) ||
      !isValidHttpUrl(formData.portfolio_url)
    ) {
      setErrorMessage('All profile and resume URLs must start with http:// or https://.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(formData);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(err?.message || 'Failed to update profile.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Student Academic Profile
          </h1>
          <p className="text-xs text-slate-500">
            Keep your academic data and contact coordinates up to date for campus drives
          </p>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Profile saved successfully!
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Personal Coordinates */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-indigo-600" />
            Basic Personal Details
          </h2>

          {/* Profile Picture Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-2">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={formData.full_name || 'Student Profile'}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-50 border border-slate-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center ring-4 ring-indigo-50/50 border border-indigo-100">
                  <User className="w-9 h-9" />
                </div>
              )}

              <label
                title="Upload Profile Picture"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md cursor-pointer transition border-2 border-white"
              >
                {isUploadingAvatar ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>

            <div className="text-center sm:text-left space-y-1">
              <p className="text-sm font-bold text-slate-800">Profile Picture</p>
              <p className="text-xs text-slate-500">
                Upload a clear passport-style photo (JPG, PNG, or WEBP, max 2 MB).
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg cursor-pointer transition border border-indigo-200">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{isUploadingAvatar ? 'Uploading...' : 'Change Photo'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                readOnly={isSupabaseConfigured}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                  isSupabaseConfigured ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                University Enrollment / Roll No. *
              </label>
              <input
                type="text"
                required
                value={formData.enrollment_no}
                onChange={(e) => setFormData({ ...formData, enrollment_no: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Academic Eligibility Details */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              Academic Credentials (Used for Automated Eligibility)
            </h2>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              Automated Verification Engine
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Engineering Department / Branch *
              </label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Graduation Passing Year *
              </label>
              <select
                value={formData.graduation_year}
                onChange={(e) => setFormData({ ...formData, graduation_year: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Current Cumulative CGPA (0.00 - 10.00) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                value={formData.cgpa}
                onChange={(e) => setFormData({ ...formData, cgpa: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Checked automatically against job requirements.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Active / Standing Backlogs *
              </label>
              <input
                type="number"
                min="0"
                max="15"
                required
                value={formData.backlogs}
                onChange={(e) => setFormData({ ...formData, backlogs: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                0 indicates clean all-clear record.
              </p>
            </div>
          </div>
        </div>

        {/* Skills & Resume Section */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-indigo-600" />
            Skills, Resume & Online Profiles
          </h2>

          {/* Technical Skills Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Technical Skills & Proficiencies
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-100"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-rose-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type skill (e.g. React, Docker, Python) and click Add"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="inline-flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* Resume Link & Direct Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Resume Document (Upload PDF to Supabase Storage or Paste Link)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder="https://drive.google.com/your-resume.pdf or upload below"
                value={formData.resume_url}
                onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
                className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl cursor-pointer transition border border-indigo-200 shrink-0">
                {isUploadingResume ? (
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload PDF</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={isUploadingResume}
                  className="hidden"
                />
              </label>
              {formData.resume_url && (
                <a
                  href={formData.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center shrink-0"
                  title="Test Link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            {formData.resume_url && (
              <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Resume attached & ready for recruiter applications
              </p>
            )}
          </div>

          {/* Social / Portfolio Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Linkedin className="w-3.5 h-3.5 text-sky-600" /> LinkedIn
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Github className="w-3.5 h-3.5 text-slate-800" /> GitHub
              </label>
              <input
                type="url"
                placeholder="https://github.com/username"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-indigo-600" /> Portfolio Site
              </label>
              <input
                type="url"
                placeholder="https://yourname.dev"
                value={formData.portfolio_url}
                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Short Professional Bio / Objective
            </label>
            <textarea
              rows={3}
              placeholder="Highlight your key project experiences, interest areas, and career goals..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Update Academic Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
