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
 * Ephemeral non-persisting client used when an Admin registers a student
 * so the Admin's own active browser session is not overwritten.
 */
export function createEphemeralAuthClient() {
  if (!isSupabaseConfigured) return supabase;
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

const ALLOWED_RESUME_EXTENSIONS = ['pdf', 'doc', 'docx'];
const ALLOWED_RESUME_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Upload resume document to Supabase Storage bucket 'resumes'
 * Validates extension, MIME type, and file size, and scopes path to studentId.
 */
export async function uploadResumeToStorage(
  file: File,
  studentId: string
): Promise<{ url: string | null; error: string | null }> {
  const fileExt = (file.name.split('.').pop() || '').toLowerCase();

  if (!ALLOWED_RESUME_EXTENSIONS.includes(fileExt)) {
    return {
      url: null,
      error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.',
    };
  }

  if (file.type && !ALLOWED_RESUME_MIME_TYPES.includes(file.type)) {
    return {
      url: null,
      error: 'Invalid file MIME type. Please upload a valid PDF or Word document.',
    };
  }

  if (file.size > MAX_RESUME_SIZE_BYTES) {
    return {
      url: null,
      error: 'File size exceeds the 5 MB limit. Please upload a smaller file.',
    };
  }

  if (!isSupabaseConfigured) {
    return {
      url: URL.createObjectURL(file),
      error: null,
    };
  }

  try {
    // Store under <studentId>/<timestamp>.<ext> so RLS folder ownership policies apply
    const safeFileName = `${Date.now()}.${fileExt}`;
    const filePath = `${studentId}/${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'application/pdf',
      });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err?.message || 'Upload failed' };
  }
}
