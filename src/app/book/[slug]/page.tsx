import { notFound } from 'next/navigation';
import { getPublicBusinessData } from '@/lib/public-booking';
import { PublicBookingClient } from '@/components/booking/public-booking-client';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface BookPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PublicBookingPage({ params }: BookPageProps) {
  const { slug } = await params;
  const { business, services, availabilityRules } = await getPublicBusinessData(slug);

  if (!business) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto font-bold text-xl">
            !
          </div>
          <h1 className="text-xl font-bold text-zinc-900">Booking Page Not Found</h1>
          <p className="text-sm text-zinc-500">
            We couldn&apos;t find a business with the link slug <code className="text-indigo-600 font-semibold">{slug}</code>. Please verify the URL or contact the business directly.
          </p>
          <Link
            href="/"
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500 hover:underline pt-2"
          >
            Go to NoShowGuard Homepage &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-1.5 font-medium text-zinc-700">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <span>Powered by NoShowGuard</span>
        </div>
        <span>Safe & Encrypted Booking</span>
      </div>

      <PublicBookingClient
        business={business}
        services={services}
        availabilityRules={availabilityRules}
      />
    </div>
  );
}
