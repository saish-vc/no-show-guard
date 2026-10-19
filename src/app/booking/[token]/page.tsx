import * as React from 'react';
import { notFound } from 'next/navigation';
import { getPublicBookingConfirmation } from '@/lib/public-booking';
import { TokenBookingManager } from '@/components/booking/token-booking-manager';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface BookingTokenPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function BookingTokenPage({ params }: BookingTokenPageProps) {
  const { token } = await params;
  const { booking, service, business } = await getPublicBookingConfirmation(token);

  if (!booking || !service || !business) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-zinc-900">Appointment Not Found</h1>
          <p className="text-sm text-zinc-500">
            We could not find an appointment with this secure confirmation token. The link may have expired or is invalid.
          </p>
          <Link href="/" className="inline-block pt-2 text-indigo-600 font-semibold text-sm">
            &larr; Return to NoShowGuard Homepage
          </Link>
        </Card>
      </div>
    );
  }

  const timeZone = business.timezone || 'UTC';
  const startUtc = parseISO(booking.starts_at_utc);
  const endUtc = parseISO(booking.ends_at_utc);

  const formattedDate = formatInTimeZone(startUtc, timeZone, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = formatInTimeZone(startUtc, timeZone, 'h:mm a');
  const formattedEndTime = formatInTimeZone(endUtc, timeZone, 'h:mm a');

  return (
    <div className="min-h-screen bg-zinc-50/60 py-10 px-4 sm:px-6 lg:px-8">
      <React.Suspense
        fallback={
          <div className="max-w-xl mx-auto py-20 text-center text-zinc-400">
            Loading appointment details...
          </div>
        }
      >
        <TokenBookingManager
          booking={booking}
          service={service}
          business={business}
          formattedDate={formattedDate}
          formattedStartTime={formattedStartTime}
          formattedEndTime={formattedEndTime}
          timeZone={timeZone}
        />
      </React.Suspense>
    </div>
  );
}
