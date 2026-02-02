import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Configuration & Client Setup (Fail-Safe)
 * 
 * This module initializes a reusable Supabase client.
 * Gracefully handles missing credentials - operations fail safely.
 * 
 * Environment Variables Required:
 * - VITE_SUPABASE_URL: Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Public anon key
 * 
 * Set these in .env.local (not tracked in git):
 * VITE_SUPABASE_URL=https://your-project.supabase.co
 * VITE_SUPABASE_ANON_KEY=your-anon-key-here
 */

// Read credentials from environment variables (VITE_ prefix for Vite)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

/**
 * Configuration status tracking
 * Used to determine if operations should proceed
 */
export interface SupabaseConfigStatus {
  isConfigured: boolean;
  isValid: boolean;
  url: string;
  hasKey: boolean;
  errors: string[];
}

/**
 * Validate Supabase credentials
 */
export const getConfigStatus = (): SupabaseConfigStatus => {
  const errors: string[] = [];
  let isValid = true;

  // Check URL
  if (!SUPABASE_URL) {
    errors.push('Missing VITE_SUPABASE_URL');
    isValid = false;
  } else if (!SUPABASE_URL.includes('supabase.co')) {
    errors.push('Invalid VITE_SUPABASE_URL - must be Supabase project URL');
    isValid = false;
  }

  // Check key
  if (!SUPABASE_ANON_KEY) {
    errors.push('Missing VITE_SUPABASE_ANON_KEY');
    isValid = false;
  } else if (SUPABASE_ANON_KEY.length < 20) {
    errors.push('Invalid VITE_SUPABASE_ANON_KEY - key seems too short');
    isValid = false;
  }

  return {
    isConfigured: SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0,
    isValid,
    url: SUPABASE_URL,
    hasKey: SUPABASE_ANON_KEY.length > 0,
    errors,
  };
};

const configStatus = getConfigStatus();

/**
 * Log configuration status to console
 */
if (!configStatus.isConfigured) {
  console.warn(
    '%c⚠️  Supabase Not Configured',
    'color: #ff9800; font-weight: bold;'
  );
  console.warn(
    '%cZones will NOT save. Follow these steps:\n\n' +
    '1. Create file: admin_web/.env.local\n' +
    '2. Add your credentials:\n' +
    '   VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    '   VITE_SUPABASE_ANON_KEY=your-anon-key\n' +
    '3. Restart dev server: npm run dev\n\n' +
    'Get credentials from Supabase Dashboard → Settings → API',
    'color: #ff9800; font-family: monospace;'
  );
} else if (!configStatus.isValid) {
  console.error(
    '%c❌ Supabase Configuration Invalid',
    'color: #f44336; font-weight: bold;'
  );
  configStatus.errors.forEach((error) => {
    console.error(`   • ${error}`);
  });
} else {
  console.log(
    '%c✅ Supabase Configured',
    'color: #4caf50; font-weight: bold;'
  );
  console.log(`   URL: ${SUPABASE_URL.substring(0, 30)}...`);
}

/**
 * Create Supabase client
 * Uses placeholder values if credentials missing - prevents crashes
 */
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      persistSession: false,
    },
  }
);

/**
 * Test Supabase connection
 * Returns success/failure and helpful error message
 */
// Cache the connection test result to prevent repeated 404s/network spam
let connectionPromise: Promise<{ success: boolean; configured: boolean; message: string }> | null = null;
let cachedConnectionResult: { success: boolean; configured: boolean; message: string } | null = null;

/**
 * Test Supabase connection
 * Returns success/failure and helpful error message
 * Caches result to avoid repeated network calls
 */
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  configured: boolean;
  message: string;
}> => {
  // If not configured, return immediately
  if (!configStatus.isConfigured) {
    return {
      success: false,
      configured: false,
      message: 'Supabase not configured',
    };
  }

  // Return cached result if available
  if (cachedConnectionResult) {
    return cachedConnectionResult;
  }

  // Reuse existing promise if test is in progress
  if (connectionPromise) {
    return connectionPromise;
  }

  // Start new test
  connectionPromise = (async () => {
    try {
      // Simple SELECT test - verifies table exists and RLS allows reads
      const { error } = await supabase
        .from('monitoring_zones')
        .select('id')
        .limit(1);

      if (error) {
        // Parse error for helpful message
        let helpText = 'Unknown error';

        if (error.message?.includes('does not exist')) {
          helpText = 'Table "monitoring_zones" not found. Create it in Supabase.';
        } else if (error.message?.includes('permission')) {
          helpText = 'RLS policy blocking reads. Add read permission.';
        } else if (error.message?.includes('Failed to fetch')) {
          helpText = 'Network error. Check Supabase URL is correct.';
        } else {
          helpText = error.message || 'Connection test failed';
        }

        console.warn('⚠️  Supabase connection test failed:', helpText);
        const result = {
          success: false,
          configured: true,
          message: helpText,
        };
        cachedConnectionResult = result;
        return result;
      }

      console.log('✅ Supabase connection successful - ready to save zones');
      const result = {
        success: true,
        configured: true,
        message: 'Connected',
      };
      cachedConnectionResult = result;
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Supabase test error:', errorMsg);

      const result = {
        success: false,
        configured: true,
        message: `Connection failed: ${errorMsg}`,
      };
      cachedConnectionResult = result;
      return result;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
};

/**
 * Safe insert wrapper - prevents crashes if Supabase not configured
 * Returns null if not configured, otherwise returns insert result
 */
export const safeInsert = async (
  table: string,
  data: Record<string, any>
): Promise<{ success: boolean; error?: string; data?: any }> => {
  if (!configStatus.isConfigured) {
    return {
      success: false,
      error: 'Supabase not configured - configure .env.local and restart',
    };
  }

  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert([data])
      .select();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      error: errorMsg,
    };
  }
};

/**
 * Export configuration status for UI components
 */
export const isSupabaseConfigured = (): boolean => {
  return configStatus.isConfigured && configStatus.isValid;
};

/**
 * Safe update wrapper - prevents crashes if Supabase not configured
 */
export const safeUpdate = async (
  table: string,
  id: string,
  data: Record<string, any>
): Promise<{ success: boolean; error?: string; data?: any }> => {
  if (!configStatus.isConfigured) {
    return {
      success: false,
      error: 'Supabase not configured',
    };
  }

  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      error: errorMsg,
    };
  }
};

/**
 * Safe delete wrapper - prevents crashes if Supabase not configured
 */
export const safeDelete = async (
  table: string,
  id: string
): Promise<{ success: boolean; error?: string }> => {
  if (!configStatus.isConfigured) {
    return {
      success: false,
      error: 'Supabase not configured',
    };
  }

  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      error: errorMsg,
    };
  }
};

export default supabase;
