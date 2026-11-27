import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const redirectPath = (location.state as any)?.from?.pathname;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your institutional email address.');
      return;
    }

    if (isSupabaseConfigured && !password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      if (res.role === 'admin') {
        navigate(redirectPath || '/admin/dashboard');
      } else {
        navigate(redirectPath || '/student/dashboard');
      }
    } else {
      setErrorMessage(res.error || 'Failed to authenticate. Please check your credentials.');
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!email.trim()) {
      setErrorMessage('Enter your email address above first, then click "Forgot?" to receive a reset link.');
      return;
    }

    setIsLoading(true);
    const res = await resetPassword(email);
    setIsLoading(false);

    if (res.success) {
      setInfoMessage('Password reset instructions have been sent to your email address.');
    } else {
      setErrorMessage(res.error || 'Could not send password reset email.');
    }
  };

  const handleQuickDemo = async (role: 'student' | 'admin') => {
    setErrorMessage('');
    setInfoMessage('');
    const demoEmail = role === 'admin' ? 'placement.officer@campus.edu' : 'priya.sharma@campus.edu';
    const demoPass = role === 'admin' ? 'AdminPass123!' : 'DemoPass123!';
    setEmail(demoEmail);
    setPassword(demoPass);

    setIsLoading(true);
    const res = await login(demoEmail, demoPass);
    setIsLoading(false);

    if (res.success) {
      navigate(res.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } else {
      setErrorMessage(
        res.error ||
          `Demo ${role} account is not set up in Supabase Auth yet. Register ${demoEmail} or create it in Supabase Authentication.`
      );
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Card Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-600/30">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign In to CampusHire
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Enter your institutional credentials to access your portal
          </p>
        </div>

        {/* Quick Demo Access Box (Authenticates via real Supabase Auth when configured) */}
        <div className="bg-gradient-to-br from-indigo-50/80 to-violet-50/80 border border-indigo-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Demo Sign-In Accounts
            </span>
            <span className="text-[10px] font-semibold bg-indigo-200/60 text-indigo-800 px-2 py-0.5 rounded-full">
              {isSupabaseConfigured ? 'Verified Auth' : 'Demo Mode'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemo('student')}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 text-indigo-950 font-bold text-xs rounded-xl border border-indigo-200/80 shadow-xs transition hover:scale-[1.02] disabled:opacity-50"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              Demo Student
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemo('admin')}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 text-indigo-950 font-bold text-xs rounded-xl border border-indigo-200/80 shadow-xs transition hover:scale-[1.02] disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
              Demo Admin / T&amp;P
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                College Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="student@campus.edu or admin@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required={isSupabaseConfigured}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Don&apos;t have a student account yet?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800">
              Register Student Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
