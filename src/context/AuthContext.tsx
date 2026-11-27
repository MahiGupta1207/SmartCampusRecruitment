import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, StudentProfile, UserRole } from '../types';
import { DEMO_USERS, INITIAL_STUDENTS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { dataService } from '../services/dataService';

interface AuthContextType {
  user: UserProfile | null;
  studentProfile: (StudentProfile & { full_name: string; email: string }) | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  register: (
    data: {
      email: string;
      password?: string;
      full_name: string;
      role?: UserRole;
      enrollment_no?: string;
      branch?: string;
      graduation_year?: number;
      cgpa?: number;
    }
  ) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  updateProfile: (
    updates: Partial<StudentProfile & { full_name: string; email: string; avatar_url?: string }>
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'campushire_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<(StudentProfile & { full_name: string; email: string }) | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSupabaseProfile = async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      setUser(null);
      setStudentProfile(null);
      return null;
    }

    const u: UserProfile = {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
    };
    setUser(u);

    if (profile.role === 'student') {
      const sp = await dataService.getStudentById(profile.id);
      setStudentProfile(sp);
    } else {
      setStudentProfile(null);
    }

    return u;
  };

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          // Clear any legacy localStorage auth override so roles cannot be spoofed
          localStorage.removeItem(AUTH_STORAGE_KEY);

          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            await loadSupabaseProfile(session.user.id);
          } else if (isMounted) {
            setUser(null);
            setStudentProfile(null);
          }
          if (isMounted) setIsLoading(false);
          return;
        }

        // Offline / Mock Demo Mode (only when Supabase is NOT configured)
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as UserProfile;
          if (isMounted) setUser(parsed);
          if (parsed.role === 'student') {
            const sp = await dataService.getStudentById(parsed.id);
            if (isMounted) setStudentProfile(sp || INITIAL_STUDENTS[0]);
          }
        } else if (isMounted) {
          setUser(DEMO_USERS.student);
          setStudentProfile(INITIAL_STUDENTS[0]);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEMO_USERS.student));
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setStudentProfile(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setStudentProfile(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadSupabaseProfile(session.user.id);
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        if (!email.trim() || !password) {
          setIsLoading(false);
          return { success: false, error: 'Email and password are required.' };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setIsLoading(false);
          const msg = error.message.toLowerCase();
          if (msg.includes('email not confirmed')) {
            return {
              success: false,
              error:
                'Your email address is not confirmed yet. Please check your inbox/spam for the verification link, or disable "Confirm email" in Supabase Authentication settings.',
            };
          }
          if (msg.includes('invalid login credentials')) {
            return {
              success: false,
              error: 'Invalid email or password. Please check your credentials and try again.',
            };
          }
          return { success: false, error: error.message };
        }

        if (data.user) {
          const loadedUser = await loadSupabaseProfile(data.user.id);
          setIsLoading(false);
          if (!loadedUser) {
            return {
              success: false,
              error: 'Account profile not found. Please contact your placement administrator.',
            };
          }
          return { success: true, role: loadedUser.role };
        }

        setIsLoading(false);
        return { success: false, error: 'Authentication failed. Please try again.' };
      }

      // Offline / Mock Demo Mode (only when Supabase is NOT configured)
      if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('officer')) {
        setUser(DEMO_USERS.admin);
        setStudentProfile(null);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEMO_USERS.admin));
        setIsLoading(false);
        return { success: true, role: 'admin' };
      } else {
        const students = await dataService.getStudents();
        const matched = students.find((s) => s.email.toLowerCase() === email.toLowerCase()) || INITIAL_STUDENTS[0];
        const studentUser: UserProfile = {
          id: matched.id,
          email: matched.email,
          full_name: matched.full_name,
          role: 'student',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop',
          created_at: new Date().toISOString(),
        };
        setUser(studentUser);
        setStudentProfile(matched);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(studentUser));
        setIsLoading(false);
        return { success: true, role: 'student' };
      }
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e?.message || 'Login failed' };
    }
  };

  const register = async (data: {
    email: string;
    password?: string;
    full_name: string;
    role?: UserRole;
    enrollment_no?: string;
    branch?: string;
    graduation_year?: number;
    cgpa?: number;
  }): Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        if (!data.password || data.password.length < 6) {
          setIsLoading(false);
          return { success: false, error: 'Password must be at least 6 characters long.' };
        }

        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
          options: {
            data: {
              full_name: data.full_name.trim(),
              // Always register as 'student' — admin accounts cannot be self-registered
              role: 'student',
              enrollment_no: data.enrollment_no?.trim() || '',
              branch: data.branch || '',
              graduation_year: data.graduation_year ?? null,
              cgpa: data.cgpa ?? null,
            },
          },
        });

        if (error) {
          setIsLoading(false);
          if (error.message.includes('Database error')) {
            return {
              success: false,
              error:
                'Registration failed due to a database error. This enrollment number may already be registered — please try a different one, or contact support.',
            };
          }
          if (error.message.includes('already registered') || error.message.includes('already been registered')) {
            return { success: false, error: 'An account with this email already exists. Please log in.' };
          }
          return { success: false, error: error.message };
        }

        // If session is returned immediately (email confirmation disabled), load profile
        if (authData.session && authData.user) {
          await loadSupabaseProfile(authData.user.id);
          setIsLoading(false);
          return { success: true, requiresEmailConfirmation: false };
        }

        setIsLoading(false);
        return { success: true, requiresEmailConfirmation: true };
      }

      // ── Fallback: mock mode (no Supabase credentials) ──
      const newId = 'user-' + Date.now();
      const newUser: UserProfile = {
        id: newId,
        email: data.email,
        full_name: data.full_name,
        role: 'student',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop',
        created_at: new Date().toISOString(),
      };

      const newStudent = await dataService.updateStudentProfile(newId, {
        id: newId,
        full_name: data.full_name,
        email: data.email,
        enrollment_no: data.enrollment_no || '2023CS' + Math.floor(100 + Math.random() * 900),
        branch: data.branch || 'Computer Science & Engineering',
        graduation_year: data.graduation_year || 2027,
        cgpa: data.cgpa || 8.0,
        backlogs: 0,
        is_placed: false,
        skills: ['Python', 'Problem Solving'],
      });
      setStudentProfile(newStudent);

      setUser(newUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      setIsLoading(false);
      return { success: true, requiresEmailConfirmation: false };
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e?.message || 'Registration failed' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!email.trim()) {
      return { success: false, error: 'Please enter your email address first.' };
    }
    if (!isSupabaseConfigured) {
      return { success: true };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send password reset email.' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signOut errors
      }
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setStudentProfile(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    // Disabled when Supabase is configured to prevent privilege escalation
    if (isSupabaseConfigured) return;

    if (role === 'admin') {
      setUser(DEMO_USERS.admin);
      setStudentProfile(null);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEMO_USERS.admin));
    } else {
      setUser(DEMO_USERS.student);
      const sp = await dataService.getStudentById(DEMO_USERS.student.id);
      setStudentProfile(sp || INITIAL_STUDENTS[0]);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEMO_USERS.student));
    }
  };

  const updateProfile = async (
    updates: Partial<StudentProfile & { full_name: string; email: string; avatar_url?: string }>
  ) => {
    if (!user) return;
    // Strip protected placement fields so students cannot self-mark as placed
    const { is_placed: _p, current_company: _c, package_lpa: _l, ...safeUpdates } = updates;
    const updated = await dataService.updateStudentProfile(user.id, safeUpdates);
    setStudentProfile(updated);
    if (safeUpdates.full_name || safeUpdates.avatar_url !== undefined) {
      setUser({
        ...user,
        full_name: safeUpdates.full_name || user.full_name,
        avatar_url: safeUpdates.avatar_url !== undefined ? safeUpdates.avatar_url : user.avatar_url,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        studentProfile,
        isLoading,
        login,
        register,
        resetPassword,
        logout,
        switchDemoRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
