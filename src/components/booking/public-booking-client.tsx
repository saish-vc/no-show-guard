'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { format, addDays } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  FileText,
  User,
  Mail,
  Phone,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { Business, Service, AvailabilityRule } from '@/types';
import type { GeneratedSlot } from '@/lib/slots';

interface PublicBookingClientProps {
  business: Business;
  services: Service[];
  availabilityRules: AvailabilityRule[];
}

export function PublicBookingClient({
  business,
  services,
  availabilityRules,
}: PublicBookingClientProps) {
  const router = useRouter();

  // State
  const [selectedService, setSelectedService] = React.useState<Service | null>(
    services.length === 1 ? services[0] : null
  );
  const [selectedDate, setSelectedDate] = React.useState<string>(''); // YYYY-MM-DD
  const [selectedSlot, setSelectedSlot] = React.useState<GeneratedSlot | null>(null);

  // Customer form fields
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');

  // UI state
  const [slots, setSlots] = React.useState<GeneratedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showPolicyModal, setShowPolicyModal] = React.useState(false);

  // Generate next 30 days
  const next30Days = React.useMemo(() => {
    const days = [];
    const today = new Date();
    // Start tomorrow or today based on time
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
      const isAvailableDay = availabilityRules.some(
        (r) => r.is_active && r.day_of_week === dayOfWeek
      );
      days.push({
        date,
        dateStr,
        dayOfWeek,
        dayName: format(date, 'EEE'),
        dayNumber: format(date, 'd'),
        monthName: format(date, 'MMM'),
        isAvailableDay,
      });
    }
    return days;
  }, [availabilityRules]);

  // Set default date to first available day if none selected
  React.useEffect(() => {
    if (!selectedDate && next30Days.length > 0) {
      const firstOpen = next30Days.find((d) => d.isAvailableDay) || next30Days[0];
      if (firstOpen) {
        setSelectedDate(firstOpen.dateStr);
      }
    }
  }, [next30Days, selectedDate]);

  // Fetch slots whenever service or date changes
  React.useEffect(() => {
    if (!selectedService || !selectedDate) {
      setSlots([]);
      return;
    }

    let isCancelled = false;
    async function fetchSlots() {
      setLoadingSlots(true);
      setErrorMessage(null);
      setSelectedSlot(null);

      try {
        const query = new URLSearchParams({
          slug: business.booking_slug,
          service_id: selectedService!.id,
          date: selectedDate,
        });

        const res = await fetch(`/api/availability?${query.toString()}`);
        const data = await res.json();

        if (!isCancelled) {
          if (res.ok && data.success) {
            setSlots(data.slots || []);
          } else {
            setSlots([]);
            setErrorMessage(data.error || 'Failed to load available times.');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setSlots([]);
          setErrorMessage('Unable to connect to availability service.');
        }
      } finally {
        if (!isCancelled) {
          setLoadingSlots(false);
        }
      }
    }

    fetchSlots();
    return () => {
      isCancelled = true;
    };
  }, [business.booking_slug, selectedService, selectedDate]);

  // Handle booking form submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedSlot) {
      setErrorMessage('Please select a service and an available time slot.');
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Please provide your full name (at least 2 characters).');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address for confirmation.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business.id,
          service_id: selectedService.id,
          customer_name: name.trim(),
          customer_email: email.trim().toLowerCase(),
          customer_phone: phone.trim() || undefined,
          starts_at_utc: selectedSlot.starts_at_utc,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Redirect to confirmation page
        router.push(
          `/book/${business.booking_slug}/confirmation?token=${data.confirmation_token}`
        );
      } else {
        setErrorMessage(
          data.error || 'Booking could not be completed. The time slot may no longer be available.'
        );
        // Refresh slots in case of double-booking
        const query = new URLSearchParams({
          slug: business.booking_slug,
          service_id: selectedService.id,
          date: selectedDate,
        });
        const freshRes = await fetch(`/api/availability?${query.toString()}`);
        const freshData = await freshRes.json();
        if (freshData.slots) setSlots(freshData.slots);
      }
    } catch (err) {
      setErrorMessage('An unexpected network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Business Header Card */}
      <Card className="border-zinc-200 shadow-sm overflow-hidden bg-white">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 px-6 py-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0 capitalize">
                  {business.business_type}
                </Badge>
                <div className="flex items-center text-xs text-indigo-100 gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Business
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {business.name}
              </h1>
              <p className="text-indigo-100 text-sm mt-1">
                Book your appointment online · Instant confirmation & email reminders
              </p>
            </div>

            {business.cancellation_policy && (
              <button
                type="button"
                onClick={() => setShowPolicyModal(!showPolicyModal)}
                className="self-start md:self-center inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                Cancellation Policy
              </button>
            )}
          </div>
        </div>

        {/* Cancellation Policy Banner/Dropdown */}
        {showPolicyModal && business.cancellation_policy && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Cancellation Policy: </span>
              {business.cancellation_policy}
            </div>
          </div>
        )}

        <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            Times shown in business timezone: <span className="font-semibold text-zinc-700">{business.timezone}</span>
          </div>
          <div>No account required</div>
        </div>
      </Card>

      {/* Global Error Banner */}
      {errorMessage && (
        <Alert variant="error" title="Unable to proceed">
          {errorMessage}
        </Alert>
      )}

      {/* Step 1: Select Service */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
            1
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Select a Service</h2>
        </div>

        {services.length === 0 ? (
          <Card className="p-6 text-center text-zinc-500">
            No active services are currently available for booking.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((srv) => {
              const isSelected = selectedService?.id === srv.id;
              return (
                <div
                  key={srv.id}
                  id={`service-card-${srv.id}`}
                  onClick={() => setSelectedService(srv)}
                  className={`cursor-pointer rounded-xl border p-5 transition-all text-left relative ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 shadow-xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-zinc-900 text-base">{srv.name}</h3>
                      {srv.description && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                          {srv.description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-1 text-zinc-600">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      {srv.duration_minutes} minutes
                    </span>
                    <span className="text-sm font-bold text-zinc-900">
                      {srv.price > 0 ? `$${srv.price.toFixed(2)}` : 'Free'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Step 2: Select Date (Next 30 Days) */}
      {selectedService && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Choose a Date</h2>
            <span className="text-xs text-zinc-400 ml-auto">Next 30 days</span>
          </div>

          {/* Date Picker Strip */}
          <div className="overflow-x-auto pb-2 scrollbar-none">
            <div className="flex gap-2 min-w-max">
              {next30Days.map((d) => {
                const isSelected = selectedDate === d.dateStr;
                const isClosed = !d.isAvailableDay;

                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    id={`date-btn-${d.dateStr}`}
                    disabled={isClosed}
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`flex flex-col items-center justify-center w-16 h-20 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm font-semibold'
                        : isClosed
                        ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed opacity-60'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <span className={`text-[11px] uppercase ${isSelected ? 'text-indigo-100' : 'text-zinc-400'}`}>
                      {d.dayName}
                    </span>
                    <span className="text-lg font-bold my-0.5">
                      {d.dayNumber}
                    </span>
                    <span className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-zinc-400'}`}>
                      {d.monthName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Step 3: Select Available Time Slot */}
      {selectedService && selectedDate && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </div>
              <h2 className="text-lg font-bold text-zinc-900">Select a Time Slot</h2>
            </div>
            <span className="text-xs text-zinc-500">
              {selectedDate}
            </span>
          </div>

          {loadingSlots ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="text-sm">Finding open slots...</span>
            </div>
          ) : slots.length === 0 ? (
            <Card className="p-8 text-center bg-zinc-50 border-dashed border-zinc-200">
              <p className="text-sm font-medium text-zinc-700">No open time slots on this date.</p>
              <p className="text-xs text-zinc-500 mt-1">
                The business is either closed or fully booked. Please select another date above.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.starts_at_utc === slot.starts_at_utc;
                return (
                  <button
                    key={slot.starts_at_utc}
                    type="button"
                    id={`slot-btn-${slot.local_start_time.replace(':', '-')}`}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-3 px-3 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'border-zinc-200 bg-white text-zinc-800 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className="text-sm font-semibold">{slot.display_time.split('–')[0]?.trim()}</div>
                    <div className={`text-[11px] ${isSelected ? 'text-indigo-100' : 'text-zinc-400'}`}>
                      to {slot.display_time.split('–')[1]?.trim()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Step 4: Customer Details & Confirmation */}
      {selectedService && selectedSlot && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              4
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Your Contact Details</h2>
          </div>

          <form onSubmit={handleBookingSubmit} className="space-y-6">
            <Card className="p-6 border-zinc-200 shadow-sm bg-white">
              <div className="space-y-4">
                <Input
                  id="customer-name"
                  label="Full Name"
                  placeholder="e.g. Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  prefixElement={<User className="h-4 w-4" />}
                />

                <Input
                  id="customer-email"
                  type="email"
                  label="Email Address"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  prefixElement={<Mail className="h-4 w-4" />}
                  helperText="Your booking confirmation and automated 24h & 2h reminder emails will be sent here."
                />

                <Input
                  id="customer-phone"
                  type="tel"
                  label="Phone Number"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  prefixElement={<Phone className="h-4 w-4" />}
                  helperText="Optional — for appointment updates."
                />
              </div>

              {/* Review Summary */}
              <div className="mt-6 p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2 text-xs">
                <div className="font-semibold text-zinc-800 text-sm mb-2 flex items-center justify-between">
                  <span>Appointment Summary</span>
                  <Badge variant="outline" className="font-normal text-[10px]">
                    No Account Needed
                  </Badge>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Service:</span>
                  <span className="font-semibold text-zinc-900">{selectedService.name}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Duration:</span>
                  <span className="font-medium text-zinc-900">{selectedService.duration_minutes} minutes</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Time:</span>
                  <span className="font-semibold text-indigo-700">
                    {selectedDate} · {selectedSlot.display_time} ({business.timezone})
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 pt-2 border-t border-zinc-200 text-sm font-bold">
                  <span>Total Due:</span>
                  <span className="text-zinc-900">
                    {selectedService.price > 0 ? `$${selectedService.price.toFixed(2)}` : 'Free'}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  id="confirm-booking-btn"
                  type="submit"
                  size="lg"
                  className="w-full text-base font-semibold"
                  isLoading={submitting}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Confirm & Book Appointment
                </Button>
                <p className="text-[11px] text-center text-zinc-400 mt-2">
                  By clicking confirm, you agree to the business cancellation policy.
                </p>
              </div>
            </Card>
          </form>
        </section>
      )}
    </div>
  );
}
