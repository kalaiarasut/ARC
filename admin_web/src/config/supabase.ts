// Single source of truth for Supabase client.
// Avoid creating multiple SupabaseClient/GoTrueClient instances in the same browser context.
export { supabase } from '../core/supabase_config';
