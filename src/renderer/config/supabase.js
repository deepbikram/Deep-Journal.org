import { createClient } from '@supabase/supabase-js';

// Supabase configuration - get from electron context or use fallback values
const supabaseUrl = window.electron?.env?.SUPABASE_URL || 'https://pldjgkcisnddmzndyqbb.supabase.co';
const supabaseAnonKey = window.electron?.env?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsZGpna2Npc25kZG16bmR5cWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MzM1OTYsImV4cCI6MjA2NTMwOTU5Nn0.8NxJrqyFwW6CNyB8z-70B42-NcTOwVJOii7sN1L9uj4';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configure auth options
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Use localStorage for session persistence in Electron
    storage: {
      getItem: (key) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: (key, value) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: (key) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      },
    },
  },
});

// OAuth redirect URL - will be handled by local server
export const OAUTH_REDIRECT_URL = 'http://localhost:3001/auth/callback';

export default supabase;
