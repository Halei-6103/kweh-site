import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Null until you add your keys to .env, so the site still runs without a backend. */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export interface VoteRow {
  user_id: string;
  week: string;
  pick: string;
}
