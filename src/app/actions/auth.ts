'use server';

import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { businessOnboardingSchema } from '@/validations/business';
import { isSupabaseConfigured, getAuthUser, getCurrentBusiness } from '@/lib/auth';
import type { Business } from '@/types';

const LOCAL_SESSION_COOKIE = 'nsg_dev_session';
const LOCAL_BUSINESS_COOKIE = 'nsg_dev_business';

export interface AuthActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Sign up a new business owner
 */
export async function signUpAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' };
  }

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  if (confirmPassword && password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const cookieStore = await cookies();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.user) {
        return { error: 'Could not create account. Please try again.' };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      return { error: message };
    }
  } else {
    // Development mode fallback session
    const mockUser = {
      id: crypto.randomUUID(),
      email,
      created_at: new Date().toISOString(),
    };
    cookieStore.set(LOCAL_SESSION_COOKIE, JSON.stringify(mockUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  redirect('/onboarding');
}

/**
 * Sign in existing business owner
 */
export async function signInAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const redirectParam = (formData.get('redirect') as string) || '/dashboard';

  if (!email || !password) {
    return { error: 'Please provide both email and password.' };
  }

  const cookieStore = await cookies();
  let userId: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.user) {
        return { error: 'Login failed. User not found.' };
      }
      userId = data.user.id;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return { error: message };
    }
  } else {
    // Dev fallback login
    const existing = cookieStore.get(LOCAL_SESSION_COOKIE)?.value;
    let mockUser;
    if (existing) {
      try {
        mockUser = JSON.parse(existing);
        mockUser.email = email;
      } catch {
        mockUser = { id: crypto.randomUUID(), email };
      }
    } else {
      mockUser = { id: crypto.randomUUID(), email };
    }

    userId = mockUser.id;
    cookieStore.set(LOCAL_SESSION_COOKIE, JSON.stringify(mockUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  // Check if business profile exists
  if (userId) {
    const business = await getCurrentBusiness(userId);
    if (!business) {
      redirect('/onboarding');
    }
  }

  redirect(redirectParam.startsWith('/') ? redirectParam : '/dashboard');
}

/**
 * Sign out
 */
export async function signOutAction() {
  const cookieStore = await cookies();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  }

  cookieStore.delete(LOCAL_SESSION_COOKIE);
  cookieStore.delete(LOCAL_BUSINESS_COOKIE);

  redirect('/login');
}

/**
 * Complete onboarding and create business profile
 */
export async function completeOnboardingAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const user = await getAuthUser();
  if (!user) {
    redirect('/login');
  }

  const rawData = {
    name: (formData.get('name') as string)?.trim(),
    business_type: formData.get('business_type') as string,
    timezone: formData.get('timezone') as string,
    booking_slug: (formData.get('booking_slug') as string)?.trim().toLowerCase(),
    cancellation_policy: (formData.get('cancellation_policy') as string)?.trim() || '',
  };

  const validation = businessOnboardingSchema.safeParse(rawData);
  if (!validation.success) {
    const firstIssue = validation.error.issues[0]?.message || 'Validation failed';
    return { error: firstIssue };
  }

  const data = validation.data;
  const cookieStore = await cookies();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();

      // Check slug uniqueness
      const { data: existingSlug } = await supabase
        .from('businesses')
        .select('id')
        .eq('booking_slug', data.booking_slug)
        .maybeSingle();

      if (existingSlug) {
        return { error: `The link slug "${data.booking_slug}" is already taken. Please choose another.` };
      }

      // Check if user already owns a business
      const { data: existingBiz } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (existingBiz) {
        redirect('/dashboard');
      }

      const { error: insertError } = await supabase.from('businesses').insert({
        owner_user_id: user.id,
        name: data.name,
        business_type: data.business_type,
        timezone: data.timezone,
        booking_slug: data.booking_slug,
        cancellation_policy: data.cancellation_policy || null,
      });

      if (insertError) {
        if (insertError.code === '23505') {
          return { error: 'You already have a registered business or this slug is taken.' };
        }
        return { error: insertError.message };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create business';
      return { error: message };
    }
  } else {
    // Development mode business storage
    const newBiz: Business = {
      id: crypto.randomUUID(),
      owner_user_id: user.id,
      name: data.name,
      business_type: data.business_type,
      timezone: data.timezone,
      booking_slug: data.booking_slug,
      cancellation_policy: data.cancellation_policy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    cookieStore.set(LOCAL_BUSINESS_COOKIE, JSON.stringify(newBiz), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  redirect('/dashboard?onboarded=true');
}
