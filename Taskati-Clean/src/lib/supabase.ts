import { createClient } from '@supabase/supabase-js';
// Import direct configuration instead of environment variables
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config';

// Create Supabase client with direct configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}

// Log confirmation of Supabase configuration
console.log('Supabase client initialized with URL:', SUPABASE_URL.substring(0, 20) + '...'); 