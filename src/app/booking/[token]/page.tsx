import { notFound, redirect } from 'next/navigation';
import { getPublicBookingConfirmation } from '@/lib/public-booking';

interface BookingTokenPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function BookingTokenPage({ params }: BookingTokenPageProps) {
  const { token } = await params;
  const { booking, business } = await getPublicBookingConfirmation(token);

  if (!booking || !business) {
    notFound();
  }

  // Redirect to the canonical confirmation page for the business
  redirect(`/book/${business.booking_slug}/confirmation?token=${token}`);
}
