import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { PlacementAnalytics } from '../../types';
import {
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  Award,
  FileCheck2,
  Download,
  CheckCircle2,
  BarChart2,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<PlacementAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      const data = await dataService.getAnalytics();
      setAnalytics(data);
      setIsLoading(false);
    };
    fetchAnalytics();
  }, []);

  const handleDownloadPlacementsCSV = async () => {
    const students = await dataService.getStudents();
    const csvContent = dataService.generatePlacementsCSV(students);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Placement_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Title and CSV Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <span>Official Training & Placement (T&P) Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus Placement Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time university recruitment statistics, branch-wise metrics, and drive performance.
          </p>
        </div>

        <button
          onClick={handleDownloadPlacementsCSV}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          <Download className="w-4 h-4" />
          Export Placements CSV Report
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Placement Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {analytics?.overallPlacementRate || 0}%
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {analytics?.offersAccepted || 0} offers accepted • {analytics?.offersPending || 0} pending
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Highest Package
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            ₹{analytics?.highestPackageLPA || 0} LPA
          </p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            Average: ₹{analytics?.averagePackageLPA || 0} LPA
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Job Drives
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {analytics?.activeJobs || 0}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            Across {analytics?.totalCompanies || 0} recruiters
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Applications
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {analytics?.totalApplications || 0}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            From {analytics?.totalStudents || 0} eligible candidates
          </p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Branch-wise Placement Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              Branch-wise Students & Placements
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Class of 2027</span>
          </div>

          <div className="h-72 w-full pt-4">
            {analytics?.branchStats && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.branchStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="branch" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="total" name="Total Students" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="placed" name="Placed Students" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Salary Package Tier Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              Salary Package (CTC) Brackets
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Offers Distribution</span>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {analytics?.packageDistribution && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.packageDistribution}
                    dataKey="count"
                    nameKey="range"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    paddingAngle={4}
                    label={(entry) => `${entry.range}: ${entry.count}`}
                  >
                    {analytics.packageDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recruitment Funnel & Top Recruiters Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Application Stage Funnel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Application Selection Funnel
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Offers: {analytics?.offersIssued || 0} issued ({analytics?.offersAccepted || 0} accepted, {analytics?.offersDeclined || 0} declined)
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {analytics?.applicationFunnel.map((item, idx) => {
              const maxCount = Math.max(...(analytics.applicationFunnel.map((f) => f.count) || [1]));
              const percent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{item.status}</span>
                    <span className="text-indigo-600 font-bold">{item.count} candidates</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(6, percent)}%`,
                        backgroundColor: COLORS[idx % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Recruiting Companies Leaderboard */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Top Recruiters by Hires
            </h3>
            <span className="text-[11px] text-slate-400">Current Season</span>
          </div>

          <div className="divide-y divide-slate-100">
            {analytics?.topCompanies && analytics.topCompanies.length > 0 ? (
              analytics.topCompanies.map((c, i) => (
                <div key={c.name} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                      {i + 1}
                    </span>
                    <span className="font-bold text-slate-800">{c.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">{c.hires} Hires</p>
                    <p className="text-[10px] text-slate-400">Avg ₹{c.avgPackage} LPA</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                Offers rolling out. Check back soon.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
