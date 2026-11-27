import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, StudentProfile, UserRole } from '../types';
import { DEMO_USERS, INITIAL_STUDENTS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { dataService } from '../services/dataService';

interface AuthContextType {
  user: UserProfile | null;
  studentProfile: (StudentProfile & { full_name: string; email: string }) | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: {
      email: string;
      password?: string;
      full_name: string;
      role: UserRole;
      enrollment_no?: string;
      branch?: string;
      graduation_year?: number;
      cgpa?: number;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<StudentProfile & { full_name: string; email: string }>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'campushire_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<(StudentProfile & { full_name: string; email: string }) | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
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
                if (sp) setStudentProfile(sp);
              }
              setIsLoading(false);
              return;
            }
          }
        }

        // Check local storage for active session
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as UserProfile;
          setUser(parsed);
          if (parsed.role === 'student') {
            const sp = await dataService.getStudentById(parsed.id);
            setStudentProfile(sp || INITIAL_STUDENTS[0]);
          }
        } else {
          // Default to student demo user for smooth immediate experience
          setUser(DEMO_USERS.student);
          setStudentProfile(INITIAL_STUDENTS[0]);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEMO_USERS.student));
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            const u: UserProfile = {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              role: profile.role,
              avatar_url: profile.avatar_url,
              created_at: profile.created_at,
            };
            setUser(u);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
            if (profile.role === 'student') {
              const sp = await dataService.getStudentById(profile.id);
              if (sp) setStudentProfile(sp);
            }
            setIsLoading(false);
            return { success: true };
          }
        }
      }

      // Check demo credentials
      if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('officer')) {
        setUser(DEMO_USERS.admin);
        setStudentProfile(null);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEMO_USERS.admin));
        setIsLoading(false);
        return { success: true };
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
        return { success: true };
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
    role: UserRole;
    enrollment_no?: string;
    branch?: string;
    graduation_year?: number;
    cgpa?: number;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && data.password) {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.full_name,
              role: data.role,
              enrollment_no: data.enrollment_no,
              branch: data.branch,
              graduation_year: data.graduation_year,
              cgpa: data.cgpa,
            },
          },
        });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
      }

      const newId = 'user-' + Date.now();
      const newUser: UserProfile = {
        id: newId,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop',
        created_at: new Date().toISOString(),
      };

      if (data.role === 'student') {
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
      }

      setUser(newUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      setIsLoading(false);
      return { success: true };
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e?.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase sign out error:', e);
      }
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setStudentProfile(null);
  };

  const switchDemoRole = async (role: UserRole) => {
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

  const updateProfile = async (updates: Partial<StudentProfile & { full_name: string; email: string }>) => {
    if (!user) return;
    const updated = await dataService.updateStudentProfile(user.id, updates);
    setStudentProfile(updated);
    if (updates.full_name || updates.email) {
      setUser({
        ...user,
        full_name: updates.full_name || user.full_name,
        email: updates.email || user.email,
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
