'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ArrowUpRight,
  Loader2,
  CalendarX2,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { BookingWithService, BookingStatus } from '@/types';

// ============================================================================
// Status badge mapping
// ============================================================================

const STATUS_CONFIG: Record<BookingStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  completed: { label: 'Completed', variant: 'success' },
  no_show: { label: 'No-Show', variant: 'destructive' },
  cancelled_by_customer: { label: 'Cancelled', variant: 'secondary' },
  cancelled_by_business: { label: 'Cancelled', variant: 'secondary' },
};

// ============================================================================
// Filter tabs
// ============================================================================

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'no_show', label: 'No-Show' },
  { key: 'cancelled', label: 'Cancelled' },
];

// ============================================================================
// Component
// ============================================================================

interface BookingsListClientProps {
  timezone: string;
  bookingSlug?: string;
}

interface PaginatedResponse {
  bookings: BookingWithService[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function BookingsListClient({ timezone, bookingSlug }: BookingsListClientProps) {
  const [data, setData] = React.useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch bookings
  const fetchBookings = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        filter: activeFilter,
        page: currentPage.toString(),
        limit: '10',
      });
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/owner/bookings?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, currentPage, debouncedSearch]);

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Reset to page 1 when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, debouncedSearch]);

  const formatDateTime = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleString('en-US', {
        timeZone: timezone,
        weekday: 'short',
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

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('en-US', {
        timeZone: timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  const formatTime = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stitch Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Bookings Management</h1>
          <p className="text-sm text-zinc-500">
            Real-time appointment schedule, customer confirmation statuses, and no-show logs.
          </p>
        </div>
        {bookingSlug && (
          <Link href={`/book/${bookingSlug}`} target="_blank">
            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </Link>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            id="bookings-search"
            placeholder="Search by customer name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="Booking filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={activeFilter === f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              activeFilter === f.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading bookings">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="hidden sm:block w-16 h-16 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && data && data.bookings.length === 0 && (
        <Card className="text-center py-16">
          <div className="space-y-3 max-w-sm mx-auto">
            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
              <CalendarX2 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">No bookings found</p>
              <p className="text-sm text-zinc-500 mt-1">
                {search
                  ? `No results for "${search}". Try a different search.`
                  : activeFilter !== 'all'
                  ? `No ${FILTERS.find((f) => f.key === activeFilter)?.label.toLowerCase()} bookings yet.`
                  : 'Bookings will appear here when customers schedule appointments.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Bookings List */}
      {!loading && data && data.bookings.length > 0 && (
        <div className="space-y-3">
          {data.bookings.map((booking) => {
            const statusCfg = STATUS_CONFIG[booking.status];
            const isPast = new Date(booking.starts_at_utc) < new Date();

            return (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="block group"
              >
                <Card className="p-4 sm:p-5 hover:border-emerald-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    {/* Date Block */}
                    <div className={`hidden sm:flex flex-col items-center justify-center w-16 h-16 rounded-xl shrink-0 ${
                      isPast ? 'bg-zinc-50 border border-zinc-200' : 'bg-emerald-50 border border-emerald-100'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isPast ? 'text-zinc-400' : 'text-emerald-500'}`}>
                        {new Date(booking.starts_at_utc).toLocaleDateString('en-US', { timeZone: timezone, month: 'short' })}
                      </span>
                      <span className={`text-xl font-bold leading-tight ${isPast ? 'text-zinc-500' : 'text-emerald-700'}`}>
                        {new Date(booking.starts_at_utc).toLocaleDateString('en-US', { timeZone: timezone, day: 'numeric' })}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm text-zinc-900 truncate">
                            {booking.service?.name || 'Unknown Service'}
                          </h3>
                          <Badge variant={statusCfg.variant} className="text-[10px]">
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-zinc-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {booking.customer_name}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {booking.customer_email}
                        </span>
                        {booking.customer_phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {booking.customer_phone}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span className="sm:hidden inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(booking.starts_at_utc)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(booking.starts_at_utc)} – {formatTime(booking.ends_at_utc)}
                        </span>
                        {booking.service && (
                          <span className="font-medium text-zinc-700">
                            ${booking.service.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-zinc-500">
            Showing {(data.page - 1) * data.limit + 1}–
            {Math.min(data.page * data.limit, data.total)} of {data.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Prev
            </Button>
            <span className="text-xs text-zinc-600 font-medium px-2">
              {data.page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={currentPage >= data.totalPages}
              className="text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
