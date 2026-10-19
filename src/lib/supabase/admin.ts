import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Admin Supabase Client (Service Role)
// Bypasses RLS — use only for:
//   - Public booking creation (customer has no auth session)
//   - Cron jobs (reminder emails)
//   - Token-based actions (confirm/cancel from email)
// NEVER expose this client to the browser.
// ============================================================================

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
