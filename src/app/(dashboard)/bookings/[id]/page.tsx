import * as React from 'react';
import { BookingDetailClient } from '@/components/dashboard/booking-detail-client';

interface BookingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params;

  return <BookingDetailClient bookingId={id} />;
}
