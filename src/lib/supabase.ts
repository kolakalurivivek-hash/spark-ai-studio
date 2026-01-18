import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Priority: Environment variables (Vercel) > localStorage (testing)
function getSupabaseConfig(): { url: string; anonKey: string } | null {
  // Check env vars first (production/Vercel)
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  // Fallback to localStorage (testing)
  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem('supabase-url');
    const storedKey = localStorage.getItem('supabase-anon-key');
    if (storedUrl && storedKey) {
      return { url: storedUrl, anonKey: storedKey };
    }
  }

  return null;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  // Create or reuse instance
  if (!supabaseInstance) {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseInstance;
}

export function hasSupabaseConfig(): boolean {
  return getSupabaseConfig() !== null;
}

export function setSupabaseCredentials(url: string, anonKey: string): void {
  localStorage.setItem('supabase-url', url);
  localStorage.setItem('supabase-anon-key', anonKey);
  // Reset instance so it's recreated with new credentials
  supabaseInstance = null;
}

export function clearSupabaseCredentials(): void {
  localStorage.removeItem('supabase-url');
  localStorage.removeItem('supabase-anon-key');
  supabaseInstance = null;
}
