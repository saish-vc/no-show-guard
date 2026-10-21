import { NextResponse } from 'next/server';
import { getAuthSession, isSupabaseConfigured } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncFromCookies } from '@/lib/dev-store';
import type { Booking, Service } from '@/types';

// ============================================================================
// GET /api/owner/stats
// Returns computed dashboard metrics for the logged-in business.
// ============================================================================

export async function GET() {
  try {
    const { user, business } = await getAuthSession();

    if (!user || !business) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let bookings: Booking[] = [];
    let services: Service[] = [];

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();

      const { data: allBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('business_id', business.id);

      const { data: allServices } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', business.id);

      bookings = (allBookings || []) as Booking[];
      services = (allServices || []) as Service[];
    } else {
      const store = await syncFromCookies();
      bookings = store.bookings.filter((b) => b.business_id === business.id);
      services = store.services.filter((s) => s.business_id === business.id);
    }

    // ---- Compute metrics ----
    const thisMonthBookings = bookings.filter(
      (b) => new Date(b.created_at) >= monthStart
    );

    const upcomingBookings = bookings.filter(
      (b) =>
        new Date(b.starts_at_utc) > now &&
        (b.status === 'pending' || b.status === 'confirmed')
    );

    const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
    const completedBookings = bookings.filter((b) => b.status === 'completed');
    const noShows = bookings.filter((b) => b.status === 'no_show');
    const cancelledByCustomer = bookings.filter((b) => b.status === 'cancelled_by_customer');
    const cancelledByBusiness = bookings.filter((b) => b.status === 'cancelled_by_business');
    const totalCancelled = cancelledByCustomer.length + cancelledByBusiness.length;

    // Cancellation rate: cancelled / (total - pending)
    const finalisedBookings = bookings.filter((b) => b.status !== 'pending');
    const cancellationRate =
      finalisedBookings.length > 0
        ? (totalCancelled / finalisedBookings.length) * 100
        : 0;

    // No-show rate: no_shows / (completed + no_shows)
    const attendancePool = completedBookings.length + noShows.length;
    const noShowRate = attendancePool > 0 ? (noShows.length / attendancePool) * 100 : 0;

    // Estimated revenue from completed bookings
    const estimatedRevenue = completedBookings.reduce((sum, booking) => {
      const service = services.find((s) => s.id === booking.service_id);
      return sum + (service?.price || 0);
    }, 0);

    // Today's bookings
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayBookings = bookings.filter((b) => {
      const start = new Date(b.starts_at_utc);
      return start >= todayStart && start <= todayEnd;
    });

    // Pending confirmations
    const pendingBookings = bookings.filter((b) => b.status === 'pending');

    return NextResponse.json({
      totalBookingsThisMonth: thisMonthBookings.length,
      upcomingBookings: upcomingBookings.length,
      confirmedBookings: confirmedBookings.length,
      completedBookings: completedBookings.length,
      noShows: noShows.length,
      noShowRate: Math.round(noShowRate * 10) / 10,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      estimatedRevenue,
      todayBookings: todayBookings.length,
      pendingBookings: pendingBookings.length,
      totalBookings: bookings.length,
      totalCancelled,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('GET /api/owner/stats error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
