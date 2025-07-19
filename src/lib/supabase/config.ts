import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

// Check if all required environment variables are set
const isConfigured = Object.values(supabaseConfig).every(Boolean);

// Initialize Supabase client
let supabase: SupabaseClient | undefined;

if (isConfigured) {
  try {
    supabase = createClient(supabaseConfig.url!, supabaseConfig.anonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    
    // Test the connection
    supabase.auth.getSession().catch((error) => {
      console.warn('Supabase connection test failed:', error);
    });
    
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    supabase = undefined;
  }
} else {
  console.warn('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
}

export { supabase, isConfigured, supabaseConfig }; 