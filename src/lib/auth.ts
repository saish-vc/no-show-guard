import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import type { Business } from '@/types';

// ============================================================================
// Auth & Business Helper Functions
// Supports live Supabase Auth + graceful local development fallback
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}

export interface AuthSession {
  user: AuthUser | null;
  business: Business | null;
}

const LOCAL_SESSION_COOKIE = 'nsg_dev_session';
const LOCAL_BUSINESS_COOKIE = 'nsg_dev_business';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('your-project') && !key.includes('your-anon-key'));
}

/**
 * Get the currently authenticated user (server-side)
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();

  // 1. If live Supabase is configured, use it
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user) {
        return {
          id: user.id,
          email: user.email || '',
          user_metadata: user.user_metadata,
        };
      }
    } catch (err) {
      console.warn('Supabase auth check failed, checking local session fallback:', err);
    }
  }

  // 2. Local session fallback (for testing and dev without Supabase keys)
  const devSession = cookieStore.get(LOCAL_SESSION_COOKIE)?.value;
  if (devSession) {
    try {
      return JSON.parse(devSession) as AuthUser;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Get the business owned by the currently authenticated user
 */
export async function getCurrentBusiness(userId: string): Promise<Business | null> {
  const cookieStore = await cookies();

  // 1. Live Supabase lookup
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return data as Business;
      }
    } catch (err) {
      console.warn('Supabase business query failed:', err);
    }
  }

  // 2. Local fallback cookie
  const devBiz = cookieStore.get(LOCAL_BUSINESS_COOKIE)?.value;
  if (devBiz) {
    try {
      const parsed = JSON.parse(devBiz) as Business;
      if (parsed.owner_user_id === userId) {
        return parsed;
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Full session check returning both user and their business profile
 */
export async function getAuthSession(): Promise<AuthSession> {
  const user = await getAuthUser();
  if (!user) {
    return { user: null, business: null };
  }

  const business = await getCurrentBusiness(user.id);
  return { user, business };
}
