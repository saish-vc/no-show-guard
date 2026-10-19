'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthUser, getCurrentBusiness, isSupabaseConfigured } from '@/lib/auth';
import { availabilityRuleSchema } from '@/validations/availability';
import { cookies } from 'next/headers';
import type { AvailabilityRule } from '@/types';

const LOCAL_AVAILABILITY_COOKIE = 'nsg_dev_availability';

export interface AvailabilityActionResult {
  error?: string;
  success?: boolean;
}

// ── Dev-mode cookie helpers ────────────────────────────────────────────────

async function getDevRules(): Promise<AvailabilityRule[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCAL_AVAILABILITY_COOKIE)?.value;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AvailabilityRule[];
  } catch {
    return [];
  }
}

async function setDevRules(rules: AvailabilityRule[]) {
  const cookieStore = await cookies();
  cookieStore.set(LOCAL_AVAILABILITY_COOKIE, JSON.stringify(rules), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

// ── Get availability rules for the current business ────────────────────────

export async function getAvailabilityRules(): Promise<AvailabilityRule[]> {
  const user = await getAuthUser();
  if (!user) return [];

  const business = await getCurrentBusiness(user.id);
  if (!business) return [];

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('business_id', business.id)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Failed to fetch availability rules:', error);
      return [];
    }
    return (data || []) as AvailabilityRule[];
  }

  // Dev fallback
  const all = await getDevRules();
  return all
    .filter((r) => r.business_id === business.id)
    .sort((a, b) => a.day_of_week - b.day_of_week);
}

// ── Save / update the entire weekly schedule ───────────────────────────────
// Strategy: Delete all existing rules for the business and insert the new set.
// This is simpler than diffing for the MVP and avoids partial-update edge cases.

export async function saveWeeklyAvailabilityAction(
  rules: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>
): Promise<AvailabilityActionResult> {
  const user = await getAuthUser();
  if (!user) return { error: 'Not authenticated.' };

  const business = await getCurrentBusiness(user.id);
  if (!business) return { error: 'No business profile found.' };

  // Validate each rule
  for (const rule of rules) {
    const result = availabilityRuleSchema.safeParse(rule);
    if (!result.success) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayLabel = dayNames[rule.day_of_week] || `Day ${rule.day_of_week}`;
      return {
        error: `${dayLabel}: ${result.error.issues[0]?.message || 'Invalid rule'}`,
      };
    }
  }

  // Check for duplicate active days
  const activeDays = rules.filter((r) => r.is_active).map((r) => r.day_of_week);
  const uniqueDays = new Set(activeDays);
  if (uniqueDays.size !== activeDays.length) {
    return { error: 'You cannot have multiple active availability windows for the same day.' };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();

    // Delete all current rules for this business
    const { error: deleteError } = await supabase
      .from('availability_rules')
      .delete()
      .eq('business_id', business.id);

    if (deleteError) {
      return { error: `Failed to clear old availability: ${deleteError.message}` };
    }

    // Insert the new set
    if (rules.length > 0) {
      const rows = rules.map((r) => ({
        business_id: business.id,
        day_of_week: r.day_of_week,
        start_time: r.start_time.length === 5 ? `${r.start_time}:00` : r.start_time,
        end_time: r.end_time.length === 5 ? `${r.end_time}:00` : r.end_time,
        is_active: r.is_active,
      }));

      const { error: insertError } = await supabase
        .from('availability_rules')
        .insert(rows);

      if (insertError) {
        return { error: `Failed to save availability: ${insertError.message}` };
      }
    }

    revalidatePath('/availability');
    return { success: true };
  }

  // Dev fallback — replace all rules for this business
  const existing = await getDevRules();
  const otherBiz = existing.filter((r) => r.business_id !== business.id);
  const newRules: AvailabilityRule[] = rules.map((r) => ({
    id: crypto.randomUUID(),
    business_id: business.id,
    day_of_week: r.day_of_week,
    start_time: r.start_time.length === 5 ? `${r.start_time}:00` : r.start_time,
    end_time: r.end_time.length === 5 ? `${r.end_time}:00` : r.end_time,
    is_active: r.is_active,
    created_at: new Date().toISOString(),
  }));

  await setDevRules([...otherBiz, ...newRules]);

  revalidatePath('/availability');
  return { success: true };
}
