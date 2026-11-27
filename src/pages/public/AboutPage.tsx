import React from 'react';
import { Target, CheckCircle2, BookOpen, ShieldCheck, HelpCircle } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About CampusHire System
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          The official Training & Placement (T&P) portal dedicated to orchestrating seamless recruitment drives between graduating students and global industry leaders.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Our Core Mission</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            To provide equal, transparent, and streamlined career opportunities to every eligible university student through rule-based automation, eliminating administrative friction, and ensuring zero ghosting during recruitment rounds.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">University Placement Code</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            All campus recruitment drives conform strictly to the University Senate guidelines, including fair chance criteria, dream/super-dream company tier policies, and standardized disciplinary integrity.
          </p>
        </div>
      </div>

      {/* Official Placement Rules */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          General Placement Guidelines & Student Policies
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              1. Automated Eligibility Adherence
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              The portal verifies student records (CGPA, active backlogs, graduation year, and academic branch) at the moment of application. Ineligible applications are blocked with an explicit reason.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2. Dream Job & Upgradation Policy
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              A placed student may only apply for higher-tier Super-Dream opportunities if the CTC offered exceeds their current package by at least 1.5x (as per university placement manual).
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              3. Mandatory Assessment Attendance
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              Students who register for a company drive are obligated to attend online assessments and interviews. Unexcused absence may lead to temporary debarment from subsequent drives.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              4. Document & Skill Authenticity
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              All credentials, projects, and resume links uploaded by the student are subject to spot verification by the T&P committee prior to final interview rounds.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Can I update my CGPA or clear backlogs after applying?
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Yes, once your semester examination results are declared, update your student profile. Future applications will immediately reflect your updated CGPA and backlog count.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              How do I know when an interview is scheduled?
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              When the placement cell or company shortlists your profile, the application status updates to &quot;Interview Scheduled&quot; with the designated interview date and notes visible directly on your dashboard.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Is there any cost for students or recruiters?
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              No. CampusHire is entirely institutional software deployed on zero-cost free-tier architecture (React, Supabase, Vercel) with ₹0 budget requirement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
