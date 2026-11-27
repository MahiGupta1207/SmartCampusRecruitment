import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Heart, ShieldCheck, Database, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight">CampusHire</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Enterprise-grade Smart Campus Recruitment & Placement Automation Platform built for universities, students, and tier-1 recruiters.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Placement Systems Operational
            </div>
          </div>

          {/* Quick Links for Students */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
              Student Resources
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/student/jobs" className="hover:text-white transition">
                  Active Job Drives
                </Link>
              </li>
              <li>
                <Link to="/student/profile" className="hover:text-white transition">
                  Student Profile & Resume
                </Link>
              </li>
              <li>
                <Link to="/student/applications" className="hover:text-white transition">
                  Application Tracker
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">
                  Placement Policies & Eligibility
                </Link>
              </li>
            </ul>
          </div>

          {/* For Recruiters & Admins */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
              Placement Cell
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/admin/dashboard" className="hover:text-white transition">
                  Placement Analytics
                </Link>
              </li>
              <li>
                <Link to="/admin/jobs" className="hover:text-white transition">
                  Drive Management
                </Link>
              </li>
              <li>
                <Link to="/admin/students" className="hover:text-white transition">
                  Student Database
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  Employer Relations & Helpdesk
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture & Tech Specs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
              Stack & Compliance
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Row Level Security (RLS) Enforced</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>PostgreSQL on Supabase Cloud</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Free Tier Certified (₹0 Budget)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} CampusHire System. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for University Placements
          </p>
        </div>
      </div>
    </footer>
  );
};
