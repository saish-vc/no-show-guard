import { notFound } from 'next/navigation';
import { getPublicBookingConfirmation } from '@/lib/public-booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';
import {
  CheckCircle2,
  Calendar,
  Clock,
  DollarSign,
  Mail,
  User,
  Phone,
  ShieldCheck,
  AlertCircle,
  FileText,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface ConfirmationPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold text-zinc-900">Missing Confirmation Token</h1>
          <p className="text-sm text-zinc-500">
            Please use the link provided in your booking confirmation to view your appointment.
          </p>
          <Link href={`/book/${slug}`} className="inline-block pt-2 text-emerald-600 font-semibold text-sm">
            &larr; Return to booking page
          </Link>
        </Card>
      </div>
    );
  }

  const { booking, service, business } = await getPublicBookingConfirmation(token);

  if (!booking || !service || !business) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-zinc-900">Booking Not Found</h1>
          <p className="text-sm text-zinc-500">
            We could not find an appointment with this confirmation token.
          </p>
          <Link href={`/book/${slug}`} className="inline-block pt-2 text-emerald-600 font-semibold text-sm">
            &larr; Return to booking page
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
    <div className="min-h-screen bg-zinc-50/60 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs animate-in zoom-in-95">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Appointment Booked!
          </h1>
          <p className="text-sm text-zinc-500">
            A confirmation email has been scheduled for{' '}
            <span className="font-semibold text-zinc-800">{booking.customer_email}</span>.
          </p>
        </div>

        {/* Appointment Card */}
        <Card className="border-zinc-200 shadow-sm overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 text-white flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-100 uppercase tracking-wider font-semibold">
                {business.name}
              </p>
              <h2 className="text-lg font-bold">{service.name}</h2>
            </div>
            <Badge className="bg-white/20 text-white border-0 font-medium capitalize">
              {booking.status}
            </Badge>
          </div>

          <CardContent className="p-6 space-y-5">
            {/* Time & Date */}
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-base">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium pl-6">
                <Clock className="h-3.5 w-3.5 text-emerald-500" />
                <span>
                  {formattedStartTime} – {formattedEndTime} ({timeZone})
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 pl-6 pt-1">
                UTC: {booking.starts_at_utc}
              </p>
            </div>

            {/* Details Grid */}
            <div className="divide-y divide-zinc-100 text-sm">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-zinc-500 flex items-center gap-2">
                  <User className="h-4 w-4 text-zinc-400" /> Name
                </span>
                <span className="font-semibold text-zinc-900">{booking.customer_name}</span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-zinc-500 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-zinc-400" /> Email
                </span>
                <span className="font-medium text-zinc-900">{booking.customer_email}</span>
              </div>

              {booking.customer_phone && (
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-zinc-500 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-zinc-400" /> Phone
                  </span>
                  <span className="font-medium text-zinc-900">{booking.customer_phone}</span>
                </div>
              )}

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-zinc-500 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-400" /> Duration
                </span>
                <span className="font-medium text-zinc-900">{service.duration_minutes} minutes</span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-zinc-500 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-zinc-400" /> Price
                </span>
                <span className="font-bold text-zinc-900">
                  {service.price > 0 ? `$${service.price.toFixed(2)}` : 'Free'}
                </span>
              </div>
            </div>

            {/* Cancellation Policy */}
            {business.cancellation_policy && (
              <div className="rounded-lg bg-amber-50/70 border border-amber-200/80 p-3 text-xs text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                  <FileText className="h-3.5 w-3.5" /> Cancellation Policy
                </div>
                <p className="text-amber-800/90 leading-relaxed">
                  {business.cancellation_policy}
                </p>
              </div>
            )}

            {/* Reminder Guarantee */}
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3.5 flex items-start gap-3 text-xs text-emerald-900">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-950 mb-0.5">Automated Reminders Included</p>
                <p className="text-emerald-800">
                  You will receive email reminders <strong>24 hours</strong> and <strong>2 hours</strong> before your appointment with one-click confirmation and cancellation links.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/book/${business.booking_slug}`}
                className="flex-1 inline-flex items-center justify-center font-medium h-10 px-4 text-sm gap-2 border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg shadow-xs transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Book Another Session
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-400">
          Powered by <span className="font-semibold text-zinc-600">NoShowGuard</span> · Appointment Protection System
        </p>
      </div>
    </div>
  );
}
