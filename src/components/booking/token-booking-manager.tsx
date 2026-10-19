'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  Calendar,
  Clock,
  DollarSign,
  User,
  Mail,
  Phone,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Sparkles,
  FileText,
  ChevronLeft,
} from 'lucide-react';
import type { Booking, Service, Business } from '@/types';

interface TokenBookingManagerProps {
  booking: Booking;
  service: Service;
  business: Business;
  formattedDate: string;
  formattedStartTime: string;
  formattedEndTime: string;
  timeZone: string;
}

export function TokenBookingManager({
  booking: initialBooking,
  service,
  business,
  formattedDate,
  formattedStartTime,
  formattedEndTime,
  timeZone,
}: TokenBookingManagerProps) {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');

  const [booking, setBooking] = React.useState<Booking>(initialBooking);
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Modals / Panels
  const [showCancelPrompt, setShowCancelPrompt] = React.useState(initialAction === 'cancel');
  const [cancelReason, setCancelReason] = React.useState('');
  const [showReschedulePrompt, setShowReschedulePrompt] = React.useState(
    initialAction === 'reschedule'
  );
  const [rescheduleNotes, setRescheduleNotes] = React.useState('');

  // Auto-trigger confirm if query param ?action=confirm
  React.useEffect(() => {
    if (initialAction === 'confirm' && booking.status === 'pending') {
      handleConfirm();
    }
  }, [initialAction]);

  const handleConfirm = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/bookings/${booking.confirmation_token}/confirm`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBooking((prev) => ({ ...prev, status: 'confirmed' }));
        setFeedback({
          type: 'success',
          message: 'Thank you! Your appointment has been confirmed.',
        });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to confirm appointment.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error while confirming appointment.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/bookings/${booking.confirmation_token}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBooking((prev) => ({ ...prev, status: 'cancelled_by_customer' }));
        setShowCancelPrompt(false);
        setFeedback({
          type: 'success',
          message: 'Your appointment has been cancelled. A cancellation confirmation was sent to your email.',
        });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to cancel appointment.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error while cancelling appointment.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/bookings/${booking.confirmation_token}/reschedule-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: rescheduleNotes }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowReschedulePrompt(false);
        setFeedback({
          type: 'success',
          message: 'Your reschedule request was sent to the business. They will follow up shortly.',
        });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to send reschedule request.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error while submitting reschedule request.' });
    } finally {
      setLoading(false);
    }
  };

  const isCancelled =
    booking.status === 'cancelled_by_customer' ||
    booking.status === 'cancelled_by_business';
  const isConfirmed = booking.status === 'confirmed';

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <Link
          href={`/book/${business.booking_slug}`}
          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-500 font-medium"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {business.name} Booking Page
        </Link>
        <span className="flex items-center gap-1 font-medium text-zinc-700">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
          Secure Customer Portal
        </span>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <Alert
          variant={feedback.type === 'success' ? 'success' : 'error'}
          title={feedback.type === 'success' ? 'Success' : 'Notice'}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Status Notice Banner */}
      {isCancelled ? (
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-red-900">Appointment Cancelled</h2>
            <p className="text-xs text-red-700 mt-0.5">
              This session was cancelled and the time slot was released.
            </p>
          </div>
        </div>
      ) : isConfirmed ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-emerald-900">Attendance Confirmed!</h2>
            <p className="text-xs text-emerald-700 mt-0.5">
              Your attendance is locked in. We look forward to meeting with you!
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-amber-900">Confirmation Needed</h2>
            <p className="text-xs text-amber-700 mt-0.5">
              Please click the &quot;Confirm Attendance&quot; button below so the business knows to expect you.
            </p>
          </div>
        </div>
      )}

      {/* Main Appointment Card */}
      <Card className="border-zinc-200 shadow-sm overflow-hidden bg-white">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-100 uppercase tracking-wider font-semibold">
              {business.name}
            </p>
            <h1 className="text-lg font-bold">{service.name}</h1>
          </div>
          <Badge
            className={`border-0 font-medium capitalize text-xs ${
              isCancelled
                ? 'bg-red-500 text-white'
                : isConfirmed
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-400 text-amber-950 font-bold'
            }`}
          >
            {booking.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* Time & Date */}
          <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-4 space-y-1">
            <div className="flex items-center gap-2 text-indigo-950 font-bold text-base">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-800 text-sm font-medium pl-6">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
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
                <User className="h-4 w-4 text-zinc-400" /> Customer
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

          {/* Actions */}
          {!isCancelled && (
            <div className="pt-2 space-y-3">
              {!isConfirmed && (
                <Button
                  id="confirm-booking-action-btn"
                  onClick={handleConfirm}
                  isLoading={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  size="lg"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Attendance
                </Button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  id="reschedule-request-btn"
                  type="button"
                  variant="outline"
                  onClick={() => setShowReschedulePrompt(!showReschedulePrompt)}
                  disabled={loading}
                  className="w-full text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Request Reschedule
                </Button>

                <Button
                  id="cancel-booking-action-btn"
                  type="button"
                  variant="outline"
                  onClick={() => setShowCancelPrompt(!showCancelPrompt)}
                  disabled={loading}
                  className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Cancel Appointment
                </Button>
              </div>
            </div>
          )}

          {/* Reschedule Request Panel */}
          {showReschedulePrompt && !isCancelled && (
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3 animate-in fade-in">
              <h3 className="text-sm font-bold text-zinc-900">Request Reschedule</h3>
              <p className="text-xs text-zinc-500">
                Let {business.name} know what days or times work best for you, and they will adjust your booking.
              </p>
              <Textarea
                id="reschedule-notes"
                placeholder="e.g. Can we move this to Thursday afternoon at 2 PM?"
                rows={3}
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReschedulePrompt(false)}
                >
                  Cancel
                </Button>
                <Button
                  id="submit-reschedule-btn"
                  type="button"
                  size="sm"
                  onClick={handleRescheduleSubmit}
                  isLoading={loading}
                >
                  Submit Request
                </Button>
              </div>
            </div>
          )}

          {/* Cancel Confirmation Prompt */}
          {showCancelPrompt && !isCancelled && (
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 space-y-3 animate-in fade-in">
              <h3 className="text-sm font-bold text-red-950">Are you sure you want to cancel?</h3>
              <p className="text-xs text-red-800">
                Cancelling will release your reserved time slot immediately. You will receive a cancellation email.
              </p>
              <Textarea
                id="cancel-reason"
                placeholder="Optional reason for cancellation..."
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCancelPrompt(false)}
                >
                  Keep Appointment
                </Button>
                <Button
                  id="confirm-cancel-btn"
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                  isLoading={loading}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="pt-2">
              <Link
                href={`/book/${business.booking_slug}`}
                className="w-full inline-flex items-center justify-center font-medium h-12 px-6 text-base gap-2 bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Book a New Appointment
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
