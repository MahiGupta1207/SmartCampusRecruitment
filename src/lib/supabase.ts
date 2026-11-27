import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseUrl.includes('your-supabase-url')
);

// Fallback dummy client if credentials are not provided yet to avoid runtime crash
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://mock-campus-recruitment.supabase.co', 'mock-anon-key');

/**
 * Upload resume document to Supabase Storage bucket 'resumes'
 */
export async function uploadResumeToStorage(
  file: File,
  studentId: string
): Promise<{ url: string | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return {
      url: URL.createObjectURL(file),
      error: null,
    };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'pdf';
    const fileName = `${studentId}-${Date.now()}.${fileExt}`;
    const filePath = `resumes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError.message);
      return { url: null, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (err: any) {
    console.error('Storage exception:', err);
    return { url: null, error: err?.message || 'Upload failed' };
  }
}
