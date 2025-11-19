import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (supabaseUrl && supabaseAnonKey) {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
  }

  return supabaseInstance;
}

export const supabase = typeof window !== 'undefined' ? getSupabase() : null;

export interface CodeSnippet {
  id: string;
  share_id: string;
  language: string;
  code: string;
  created_at: string;
}
