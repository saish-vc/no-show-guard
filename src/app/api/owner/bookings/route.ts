import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, isSupabaseConfigured } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncFromCookies } from '@/lib/dev-store';
import type { BookingWithService, Service } from '@/types';

// ============================================================================
// GET /api/owner/bookings
// Returns all bookings for the authenticated business owner with filtering,
// pagination, and service data joined.
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { user, business } = await getAuthSession();

    if (!user || !business) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';

    const now = new Date().toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();

      let query = supabase
        .from('bookings')
        .select('*, services(*)', { count: 'exact' })
        .eq('business_id', business.id)
        .order('starts_at_utc', { ascending: false });

      // Apply filters
      switch (filter) {
        case 'today':
          query = query
            .gte('starts_at_utc', todayStart.toISOString())
            .lte('starts_at_utc', todayEnd.toISOString());
          break;
        case 'upcoming':
          query = query
            .gte('starts_at_utc', now)
            .in('status', ['pending', 'confirmed']);
          break;
        case 'past':
          query = query.lt('starts_at_utc', now);
          break;
        case 'pending':
          query = query.eq('status', 'pending');
          break;
        case 'confirmed':
          query = query.eq('status', 'confirmed');
          break;
        case 'completed':
          query = query.eq('status', 'completed');
          break;
        case 'no_show':
          query = query.eq('status', 'no_show');
          break;
        case 'cancelled':
          query = query.in('status', ['cancelled_by_customer', 'cancelled_by_business']);
          break;
      }

      // Search by customer name or email
      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Reshape to match BookingWithService
      const bookings = (data || []).map((row: Record<string, unknown>) => ({
        ...row,
        service: row.services as Service,
        services: undefined,
      }));

      return NextResponse.json({
        bookings,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }

    // Dev mode fallback
    const store = await syncFromCookies();

    let bookings = store.bookings
      .filter((b) => b.business_id === business.id)
      .map((b) => {
        const service = store.services.find((s) => s.id === b.service_id);
        return { ...b, service: service || null } as BookingWithService;
      });

    // Apply filters
    switch (filter) {
      case 'today':
        bookings = bookings.filter((b) => {
          const start = new Date(b.starts_at_utc);
          return start >= todayStart && start <= todayEnd;
        });
        break;
      case 'upcoming':
        bookings = bookings.filter(
          (b) =>
            new Date(b.starts_at_utc) >= new Date(now) &&
            (b.status === 'pending' || b.status === 'confirmed')
        );
        break;
      case 'past':
        bookings = bookings.filter((b) => new Date(b.starts_at_utc) < new Date(now));
        break;
      case 'pending':
        bookings = bookings.filter((b) => b.status === 'pending');
        break;
      case 'confirmed':
        bookings = bookings.filter((b) => b.status === 'confirmed');
        break;
      case 'completed':
        bookings = bookings.filter((b) => b.status === 'completed');
        break;
      case 'no_show':
        bookings = bookings.filter((b) => b.status === 'no_show');
        break;
      case 'cancelled':
        bookings = bookings.filter(
          (b) => b.status === 'cancelled_by_customer' || b.status === 'cancelled_by_business'
        );
        break;
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      bookings = bookings.filter(
        (b) =>
          b.customer_name.toLowerCase().includes(q) ||
          b.customer_email.toLowerCase().includes(q)
      );
    }

    // Sort descending by start time
    bookings.sort(
      (a, b) => new Date(b.starts_at_utc).getTime() - new Date(a.starts_at_utc).getTime()
    );

    // Paginate
    const total = bookings.length;
    const start = (page - 1) * limit;
    const paginatedBookings = bookings.slice(start, start + limit);

    return NextResponse.json({
      bookings: paginatedBookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('GET /api/owner/bookings error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
