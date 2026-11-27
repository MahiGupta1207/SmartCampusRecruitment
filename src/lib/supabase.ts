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

    // Store canonical private reference; signed URLs are generated on demand
    return { url: `storage://resumes/${filePath}`, error: null };
  } catch (err: any) {
    return { url: null, error: err?.message || 'Upload failed' };
  }
}

/**
 * Resolve a stored resume reference (private storage://resumes/... or legacy Supabase URL)
 * to a short-lived signed URL, or open external links directly.
 */
export async function openAccessibleResume(resumeUrl: string): Promise<void> {
  if (!resumeUrl) return;

  let storagePath: string | null = null;
  if (resumeUrl.startsWith('storage://resumes/')) {
    storagePath = resumeUrl.replace('storage://resumes/', '');
  } else {
    const match = resumeUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/resumes\/([^?]+)/);
    if (match?.[1]) {
      storagePath = decodeURIComponent(match[1]);
    }
  }

  if (storagePath && isSupabaseConfigured) {
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(storagePath, 300);
    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      return;
    }
  }

  window.open(resumeUrl, '_blank', 'noopener,noreferrer');
}

const ALLOWED_AVATAR_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Upload student profile picture to Supabase Storage ('avatars' bucket, falling back to 'resumes' if needed).
 */
export async function uploadAvatarToStorage(
  file: File,
  userId: string
): Promise<{ url: string | null; error: string | null }> {
  const fileExt = (file.name.split('.').pop() || '').toLowerCase();

  if (!ALLOWED_AVATAR_EXTENSIONS.includes(fileExt)) {
    return {
      url: null,
      error: 'Invalid image type. Only JPG, PNG, and WEBP images are allowed.',
    };
  }

  if (file.type && !ALLOWED_AVATAR_MIME_TYPES.includes(file.type)) {
    return {
      url: null,
      error: 'Invalid image MIME type. Please upload a valid JPG, PNG, or WEBP file.',
    };
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return {
      url: null,
      error: 'Image size exceeds the 2 MB limit. Please upload a smaller image.',
    };
  }

  if (!isSupabaseConfigured) {
    return {
      url: URL.createObjectURL(file),
      error: null,
    };
  }

  try {
    const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

    let bucket = 'avatars';
    let { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    // Fallback to 'resumes' bucket if 'avatars' bucket hasn't been created yet
    if (uploadError && uploadError.message.toLowerCase().includes('not found')) {
      bucket = 'resumes';
      const fallback = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg',
        });
      uploadError = fallback.error;
    }

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err?.message || 'Image upload failed' };
  }
}
