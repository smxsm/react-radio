import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://iddsgsocgqklrqeuykzn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkZHNnc29jZ3FrbHJxZXV5a3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc4NjcxMzMsImV4cCI6MTk5MzQ0MzEzM30.4mE0-3D3KoMbV1jFEupgxfPqA9Y2ViNkIY5YaNhLb34',
  {
    auth: {
      persistSession: false,
    },
  }
);

export default function useSupabase() {
  return supabase;
}
