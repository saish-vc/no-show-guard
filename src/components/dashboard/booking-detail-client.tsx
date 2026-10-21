'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  DollarSign,
  CheckCircle2,
  XCircle,
  UserX,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Bell,
  FileText,
  Briefcase,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { BookingWithService, BookingEvent, BookingStatus, Business } from '@/types';

// ============================================================================
// Status config
// ============================================================================

const STATUS_CONFIG: Record<
  BookingStatus,
  {
    label: string;
    variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary';
    color: string;
    bgColor: string;
    icon: React.ElementType;
  }
> = {
  pending: {
    label: 'Pending Confirmation',
    variant: 'warning',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    variant: 'default',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
    icon: ShieldCheck,
  },
  completed: {
    label: 'Completed',
    variant: 'success',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
    icon: CheckCircle2,
  },
  no_show: {
    label: 'No-Show',
    variant: 'destructive',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    icon: UserX,
  },
  cancelled_by_customer: {
    label: 'Cancelled by Customer',
    variant: 'secondary',
    color: 'text-zinc-500',
    bgColor: 'bg-zinc-50 border-zinc-200',
    icon: XCircle,
  },
  cancelled_by_business: {
    label: 'Cancelled by Business',
    variant: 'secondary',
    color: 'text-zinc-500',
    bgColor: 'bg-zinc-50 border-zinc-200',
    icon: XCircle,
  },
};

// ============================================================================
// Event type display config
// ============================================================================

const EVENT_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  created: { label: 'Booking Created', icon: Calendar, color: 'text-emerald-500' },
  confirmed: { label: 'Confirmed', icon: CheckCircle2, color: 'text-emerald-500' },
  completed: { label: 'Marked Completed', icon: CheckCircle2, color: 'text-emerald-600' },
  marked_no_show: { label: 'Marked No-Show', icon: UserX, color: 'text-red-500' },
  cancelled_by_customer: { label: 'Cancelled by Customer', icon: XCircle, color: 'text-zinc-500' },
  cancelled_by_business: { label: 'Cancelled by Business', icon: XCircle, color: 'text-zinc-500' },
  reminder_24h_sent: { label: '24h Reminder Sent', icon: Bell, color: 'text-amber-500' },
  reminder_2h_sent: { label: '2h Reminder Sent', icon: Bell, color: 'text-orange-500' },
  confirmation_email_sent: { label: 'Confirmation Email Sent', icon: Mail, color: 'text-blue-500' },
  cancellation_email_sent: { label: 'Cancellation Email Sent', icon: Mail, color: 'text-zinc-500' },
  rescheduled: { label: 'Reschedule Requested', icon: Calendar, color: 'text-purple-500' },
};

// ============================================================================
// Component
// ============================================================================

interface BookingDetailClientProps {
  bookingId: string;
}

export function BookingDetailClient({ bookingId }: BookingDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [booking, setBooking] = React.useState<BookingWithService | null>(null);
  const [business, setBusiness] = React.useState<Business | null>(null);
  const [events, setEvents] = React.useState<BookingEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);

  const fetchBooking = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/bookings/${bookingId}`);
      if (!res.ok) {
        setError('Booking not found or access denied.');
        return;
      }
      const data = await res.json();
      setBooking(data.booking);
      setEvents(data.events || []);
      setBusiness(data.business);
    } catch {
      setError('Failed to load booking details.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  React.useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleAction = async (action: string) => {
    if (!booking) return;

    setActionLoading(action);
    try {
      const res = await fetch(`/api/owner/bookings/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (res.ok) {
        // Re-fetch to get updated booking and events
        await fetchBooking();
        setShowCancelConfirm(false);
        if (action === 'mark_completed') {
          toast.success('Appointment successfully marked as completed!');
        } else if (action === 'mark_no_show') {
          toast.info('Appointment recorded as no-show.');
        } else if (action === 'cancel_by_business') {
          toast.info('Appointment cancelled by business.');
        } else {
          toast.success('Status updated successfully.');
        }
      } else {
        toast.error(data.error || 'Action failed.');
      }
    } catch {
      toast.error('Failed to perform action.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDateTime = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const tz = business?.timezone || 'UTC';
      return date.toLocaleString('en-US', {
        timeZone: tz,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  const formatEventTime = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl" aria-busy="true" aria-label="Loading booking details">
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-48" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            </Card>
          </div>
          <div>
            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-24 rounded-xl" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-4">
        <Link href="/bookings" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
          <ArrowLeft className="h-4 w-4" /> Back to Bookings
        </Link>
        <Card className="text-center py-12">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <p className="font-semibold text-zinc-900">{error || 'Booking not found.'}</p>
        </Card>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[booking.status];
  const StatusIcon = statusCfg.icon;
  const isPast = new Date(booking.starts_at_utc) < new Date();
  const canComplete = booking.status === 'confirmed';
  const canMarkNoShow = booking.status === 'confirmed' || booking.status === 'pending';
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Bookings
      </Link>

      {/* Status Banner */}
      <div className={`rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${statusCfg.bgColor}`}>
        <div className={`h-12 w-12 rounded-xl bg-white/80 flex items-center justify-center ${statusCfg.color} shrink-0`}>
          <StatusIcon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-zinc-900">{statusCfg.label}</h2>
          <p className="text-sm text-zinc-600">
            Booking #{booking.id.slice(0, 8)}… · Created{' '}
            {new Date(booking.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <Badge variant={statusCfg.variant} className="shrink-0 text-xs">
          {statusCfg.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                Appointment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Service</span>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium text-zinc-900">{booking.service?.name || '—'}</span>
                  </div>
                  {booking.service?.description && (
                    <p className="text-xs text-zinc-500 ml-6">{booking.service.description}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Price</span>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-zinc-400" />
                    <span className="font-bold text-zinc-900 text-lg">
                      ${booking.service?.price.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Start Time</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium text-zinc-900">
                      {formatDateTime(booking.starts_at_utc)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Duration</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium text-zinc-900">
                      {booking.service?.duration_minutes || '—'} minutes
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50">
                  <User className="h-4 w-4 text-zinc-400" />
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400">Name</span>
                    <p className="font-medium text-sm text-zinc-900">{booking.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400">Email</span>
                    <p className="font-medium text-sm text-zinc-900 truncate">{booking.customer_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400">Phone</span>
                    <p className="font-medium text-sm text-zinc-900">{booking.customer_phone || '—'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event History Timeline */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Event History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">No events recorded yet.</p>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-zinc-200" />

                  <div className="space-y-4">
                    {events.map((event, idx) => {
                      const evtCfg = EVENT_CONFIG[event.event_type] || {
                        label: event.event_type.replace(/_/g, ' '),
                        icon: FileText,
                        color: 'text-zinc-400',
                      };
                      const EvtIcon = evtCfg.icon;

                      return (
                        <div key={event.id || idx} className="flex gap-3 relative">
                          <div className={`h-8 w-8 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center shrink-0 z-10 ${evtCfg.color}`}>
                            <EvtIcon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-zinc-900">
                                {evtCfg.label}
                              </span>
                              <span className="text-[11px] text-zinc-400 whitespace-nowrap">
                                {formatEventTime(event.created_at)}
                              </span>
                            </div>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="mt-0.5 text-xs text-zinc-500 space-x-2">
                                {Boolean(event.metadata.customer_email) && (
                                  <span>by {String(event.metadata.customer_email)}</span>
                                )}
                                {Boolean(event.metadata.reason) && (
                                  <span>Reason: {String(event.metadata.reason)}</span>
                                )}
                                {event.metadata.marked_by === 'owner' && (
                                  <span>by business owner</span>
                                )}
                                {event.metadata.confirmed_via === 'token_link' && (
                                  <span>via email link</span>
                                )}
                                {Boolean(event.metadata.sent_to) && (
                                  <span>sent to {String(event.metadata.sent_to)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          {/* Owner Actions */}
          {(canComplete || canMarkNoShow || canCancel) && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-zinc-900">
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canComplete && (
                  <Button
                    id="btn-mark-completed"
                    size="md"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleAction('complete')}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'complete' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Mark as Completed
                  </Button>
                )}

                {canMarkNoShow && (
                  <Button
                    id="btn-mark-noshow"
                    size="md"
                    variant="outline"
                    className="w-full text-amber-700 border-amber-200 hover:bg-amber-50"
                    onClick={() => handleAction('no_show')}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'no_show' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserX className="h-4 w-4 mr-2" />
                    )}
                    Mark as No-Show
                  </Button>
                )}

                {canCancel && !showCancelConfirm && (
                  <Button
                    id="btn-cancel-booking"
                    size="md"
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={!!actionLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </Button>
                )}

                {showCancelConfirm && (
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50/50 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-800">
                        Are you sure? This will cancel the booking and notify the customer via email.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white flex-1"
                        onClick={() => handleAction('cancel')}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === 'cancel' ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : null}
                        Confirm Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={!!actionLoading}
                      >
                        Keep Booking
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-zinc-900">
                Quick Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Booking ID</span>
                <span className="font-mono text-xs text-zinc-700">{booking.id.slice(0, 12)}…</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Token</span>
                <span className="font-mono text-xs text-zinc-700">{booking.confirmation_token.slice(0, 12)}…</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">24h Reminder</span>
                <span className="text-xs">
                  {booking.reminder_24h_sent_at ? (
                    <Badge variant="success" className="text-[10px]">Sent</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Not Sent</Badge>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">2h Reminder</span>
                <span className="text-xs">
                  {booking.reminder_2h_sent_at ? (
                    <Badge variant="success" className="text-[10px]">Sent</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Not Sent</Badge>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Last Updated</span>
                <span className="text-xs text-zinc-700">
                  {new Date(booking.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
