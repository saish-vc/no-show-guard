'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthUser, getCurrentBusiness, isSupabaseConfigured } from '@/lib/auth';
import { serviceSchema } from '@/validations/service';
import { cookies } from 'next/headers';
import type { Service } from '@/types';

const LOCAL_SERVICES_COOKIE = 'nsg_dev_services';

export interface ServiceActionResult {
  error?: string;
  success?: boolean;
  service?: Service;
}

// ── Helpers for dev-mode cookie-based storage ──────────────────────────────

async function getDevServices(): Promise<Service[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCAL_SERVICES_COOKIE)?.value;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Service[];
  } catch {
    return [];
  }
}

async function setDevServices(services: Service[]) {
  const cookieStore = await cookies();
  cookieStore.set(LOCAL_SERVICES_COOKIE, JSON.stringify(services), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

// ── Get all services for the current business ──────────────────────────────

export async function getServices(): Promise<Service[]> {
  const user = await getAuthUser();
  if (!user) return [];

  const business = await getCurrentBusiness(user.id);
  if (!business) return [];

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch services:', error);
      return [];
    }
    return (data || []) as Service[];
  }

  // Dev fallback
  const all = await getDevServices();
  return all.filter((s) => s.business_id === business.id);
}

// ── Create a new service ──────────────────────────────────────────────────

export async function createServiceAction(
  _prevState: ServiceActionResult | null,
  formData: FormData
): Promise<ServiceActionResult> {
  const user = await getAuthUser();
  if (!user) return { error: 'Not authenticated.' };

  const business = await getCurrentBusiness(user.id);
  if (!business) return { error: 'No business profile found.' };

  const rawData = {
    name: (formData.get('name') as string)?.trim(),
    description: (formData.get('description') as string)?.trim() || '',
    duration_minutes: parseInt(formData.get('duration_minutes') as string, 10),
    price: parseFloat(formData.get('price') as string),
    is_active: formData.get('is_active') !== 'false',
  };

  const validation = serviceSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || 'Validation failed' };
  }

  const data = validation.data;

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const { data: newService, error } = await supabase
      .from('services')
      .insert({
        business_id: business.id,
        name: data.name,
        description: data.description || null,
        duration_minutes: data.duration_minutes,
        price: data.price,
        is_active: data.is_active,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/services');
    return { success: true, service: newService as Service };
  }

  // Dev fallback
  const newService: Service = {
    id: crypto.randomUUID(),
    business_id: business.id,
    name: data.name,
    description: data.description || null,
    duration_minutes: data.duration_minutes,
    price: data.price,
    is_active: data.is_active,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existing = await getDevServices();
  existing.push(newService);
  await setDevServices(existing);

  revalidatePath('/services');
  return { success: true, service: newService };
}

// ── Update a service ───────────────────────────────────────────────────────

export async function updateServiceAction(
  _prevState: ServiceActionResult | null,
  formData: FormData
): Promise<ServiceActionResult> {
  const user = await getAuthUser();
  if (!user) return { error: 'Not authenticated.' };

  const business = await getCurrentBusiness(user.id);
  if (!business) return { error: 'No business profile found.' };

  const serviceId = formData.get('service_id') as string;
  if (!serviceId) return { error: 'Service ID is required.' };

  const rawData = {
    name: (formData.get('name') as string)?.trim(),
    description: (formData.get('description') as string)?.trim() || '',
    duration_minutes: parseInt(formData.get('duration_minutes') as string, 10),
    price: parseFloat(formData.get('price') as string),
    is_active: formData.get('is_active') !== 'false',
  };

  const validation = serviceSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || 'Validation failed' };
  }

  const data = validation.data;

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const { data: updated, error } = await supabase
      .from('services')
      .update({
        name: data.name,
        description: data.description || null,
        duration_minutes: data.duration_minutes,
        price: data.price,
        is_active: data.is_active,
      })
      .eq('id', serviceId)
      .eq('business_id', business.id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/services');
    return { success: true, service: updated as Service };
  }

  // Dev fallback
  const existing = await getDevServices();
  const idx = existing.findIndex((s) => s.id === serviceId && s.business_id === business.id);
  if (idx === -1) return { error: 'Service not found.' };

  existing[idx] = {
    ...existing[idx],
    name: data.name,
    description: data.description || null,
    duration_minutes: data.duration_minutes,
    price: data.price,
    is_active: data.is_active,
    updated_at: new Date().toISOString(),
  };
  await setDevServices(existing);

  revalidatePath('/services');
  return { success: true, service: existing[idx] };
}

// ── Toggle service active state ─────────────────────────────────────────────

export async function toggleServiceActiveAction(
  serviceId: string,
  isActive: boolean
): Promise<ServiceActionResult> {
  const user = await getAuthUser();
  if (!user) return { error: 'Not authenticated.' };

  const business = await getCurrentBusiness(user.id);
  if (!business) return { error: 'No business profile found.' };

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('services')
      .update({ is_active: isActive })
      .eq('id', serviceId)
      .eq('business_id', business.id);

    if (error) return { error: error.message };

    revalidatePath('/services');
    return { success: true };
  }

  // Dev fallback
  const existing = await getDevServices();
  const idx = existing.findIndex((s) => s.id === serviceId && s.business_id === business.id);
  if (idx === -1) return { error: 'Service not found.' };

  existing[idx].is_active = isActive;
  existing[idx].updated_at = new Date().toISOString();
  await setDevServices(existing);

  revalidatePath('/services');
  return { success: true };
}

// ── Delete a service ──────────────────────────────────────────────────────

export async function deleteServiceAction(
  serviceId: string
): Promise<ServiceActionResult> {
  const user = await getAuthUser();
  if (!user) return { error: 'Not authenticated.' };

  const business = await getCurrentBusiness(user.id);
  if (!business) return { error: 'No business profile found.' };

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)
      .eq('business_id', business.id);

    if (error) {
      if (error.code === '23503') {
        return { error: 'Cannot delete a service that has existing bookings. Archive it instead.' };
      }
      return { error: error.message };
    }

    revalidatePath('/services');
    return { success: true };
  }

  // Dev fallback
  const existing = await getDevServices();
  const filtered = existing.filter((s) => !(s.id === serviceId && s.business_id === business.id));
  await setDevServices(filtered);

  revalidatePath('/services');
  return { success: true };
}
