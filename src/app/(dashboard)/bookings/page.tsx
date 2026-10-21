import * as React from 'react';
import { getAuthSession } from '@/lib/auth';
import { BookingsListClient } from '@/components/dashboard/bookings-list-client';

export default async function BookingsPage() {
  const { business } = await getAuthSession();

  if (!business) {
    return null;
  }

  return (
    <div className="space-y-6">
      <BookingsListClient
        timezone={business.timezone}
        bookingSlug={business.booking_slug}
      />
    </div>
  );
}

