import { createBrowserClient } from '@supabase/ssr';

// ============================================================================
// Browser Supabase Client
// Used in Client Components (hooks, event handlers, etc.)
// ============================================================================

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
