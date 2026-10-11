import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://trpefnvbqbtrruedbhza.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycGVmbnZicWJ0cnJ1ZWRiaHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NTYxNjcsImV4cCI6MjEwNDAzMjE2N30.ukqlZwk4IJfmIyy5a7h_DfeOPFok_p1V323GAY32sao';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder')
);

// Create client lazily or safely with fallback to avoid crashing if env vars not provided yet
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Types for authentication & sync
export interface UserProfileCloud {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  gpa_scale?: string;
  current_gpa?: number;
  target_gpa?: number;
}
