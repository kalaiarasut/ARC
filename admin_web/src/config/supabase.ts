import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zaimfwpaloadjrljgdzd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaW1md3BhbG9hZGpybGpnZHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDgwNTQsImV4cCI6MjA4NTMyNDA1NH0.en3NwTc64eLy633LLLl4kMRfycvDPJKEUDZUo7cxg6Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
