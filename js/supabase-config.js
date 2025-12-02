// Supabase Configuration
// =====================================

const SUPABASE_URL = 'https://mmxofcifnpracghyuhmd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1teG9mY2lmbnByYWNnaHl1aG1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjA2NzMsImV4cCI6MjA4MDE5NjY3M30.VRiJQYQWVfsovwTsVgfCXs_T0MB_Pi2-8tFoRFL1q_w';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other modules
window.supabaseClient = supabase;
