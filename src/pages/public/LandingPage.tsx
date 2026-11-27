import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Building2,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Award,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { PlacementAnalytics, Job, Company } from '../../types';

export const LandingPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<PlacementAnalytics | null>(null);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const load = async () => {
      const stats = await dataService.getAnalytics();
      const jobs = await dataService.getJobs();
      const comps = await dataService.getCompanies();
      setAnalytics(stats);
      setFeaturedJobs(jobs.slice(0, 3));
      setCompanies(comps);
    };
    load();
  }, []);

  return (
    <div className="space-y-20 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-100/80 text-indigo-700 border border-indigo-200 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Campus Recruitment Automation 2026-2027</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Bridging Campus Talent with{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 bg-clip-text text-transparent">
                World-Class Careers
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              Empower university students, placement officers, and top-tier recruiters with automated eligibility screening, instant application tracking, and end-to-end recruitment intelligence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/student/jobs"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5"
              >
                <Briefcase className="w-5 h-5" />
                Explore Active Drives
              </Link>
              <Link
                to="/admin/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold rounded-xl shadow-xs transition hover:border-slate-300"
              >
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Placement Officer Demo
              </Link>
            </div>

            {/* Trust highlights */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated Eligibility Checks
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Zero Ghosting Status Pipeline
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100% Free Tier Architecture
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">
                {analytics?.overallPlacementRate || 85.4}%
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                Overall Placement Rate
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                <Award className="w-6 h-6" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">
                ₹{analytics?.highestPackageLPA || 42} LPA
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                Highest CTC Offered
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">
                {companies.length}+
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                Tier-1 Partner Recruiters
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-3">
                <Briefcase className="w-6 h-6" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">
                {analytics?.activeJobs || 6} Active
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                Current Hiring Drives
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Partner Companies */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Partnered with Leading Global Tech & Consulting Titans
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center">
          {companies.map((c) => (
            <div
              key={c.id}
              className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex flex-col items-center gap-2 hover:border-indigo-200 hover:shadow-md transition group"
            >
              <img
                src={c.logo_url}
                alt={c.name}
                className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition"
              />
              <span className="text-xs font-bold text-slate-700 text-center truncate max-w-full">
                {c.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Job Opportunities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Campus Drives
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Hand-picked opportunities currently accepting student applications.
            </p>
          </div>
          <Link
            to="/student/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition"
          >
            Browse all openings <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-indigo-300 hover:shadow-lg transition-all group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={job.company?.logo_url}
                      alt={job.company?.name}
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-100"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                        {job.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">{job.company?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold">
                    ₹{job.salary_min_lpa} - ₹{job.salary_max_lpa} LPA
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                    {job.job_type}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                    Min CGPA: {job.eligibility.min_cgpa}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Deadline: {new Date(job.deadline).toLocaleDateString()}
                </span>
                <Link
                  to="/student/jobs"
                  className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800"
                >
                  View Criteria <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why CampusHire Section */}
      <section className="bg-slate-900 text-white py-20 rounded-3xl mx-4 sm:mx-6 lg:mx-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Intelligent Campus Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Designed for Campus Recruiter Efficiency
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Eliminate endless Excel sheets, missed eligibility criteria, and broken email chains with a unified campus placement engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/70 border border-slate-700/60 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Guaranteed Eligibility Filter</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Students can only apply if they strictly meet CGPA thresholds, allowable backlogs, branch permissions, and passing batch criteria.
              </p>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/60 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Live Status Milestones</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Full transparency for candidates across Applied, Under Review, Shortlisted, Interview rounds, and Final Selection with interview schedules.
              </p>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/60 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Real-time Placement Intel</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Placement Directors receive live charts on branch-wise placement percentages, salary bracket distributions, and 1-click CSV report downloads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-900">
          Ready to kickstart your campus placement journey?
        </h2>
        <p className="text-slate-600 text-sm max-w-lg mx-auto">
          Sign up with your college credentials to unlock eligible openings or explore the platform using the built-in demo credentials.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition"
          >
            Create Student Profile
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition"
          >
            Sign In with Demo
          </Link>
        </div>
      </section>
    </div>
  );
};
