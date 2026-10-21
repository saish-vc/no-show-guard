'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  CheckCircle2,
  Clock,
  UserX,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  XCircle,
  CalendarCheck,
} from 'lucide-react';

// ============================================================================
// Dashboard Stats Client — fetches and renders live metrics
// ============================================================================

interface StatsData {
  totalBookingsThisMonth: number;
  upcomingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  noShows: number;
  noShowRate: number;
  cancellationRate: number;
  estimatedRevenue: number;
  todayBookings: number;
  pendingBookings: number;
  totalBookings: number;
  totalCancelled: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  href?: string;
}

function StatCard({ label, value, description, icon: Icon, iconBg, iconColor, valueColor, href }: StatCardProps) {
  const content = (
    <Card className={`${href ? 'hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group' : ''}`}>
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
          <p className={`text-2xl font-bold ${valueColor || 'text-zinc-900'}`}>{value}</p>
          <p className="text-[11px] text-zinc-400">{description}</p>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          {href && (
            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-emerald-500 transition-colors" />
          )}
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

import { Skeleton } from '@/components/ui/skeleton';

export function DashboardStatsClient() {
  const [stats, setStats] = React.useState<StatsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const fetchStats = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/owner/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true" aria-label="Loading statistics">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-2.5 w-28" />
              </div>
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="p-6 text-center" role="alert">
        <div className="max-w-xs mx-auto space-y-3">
          <p className="text-sm font-medium text-zinc-700">Unable to load dashboard metrics.</p>
          <button
            onClick={fetchStats}
            type="button"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 underline focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
          >
            Try reloading statistics
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="This Month"
        value={stats.totalBookingsThisMonth}
        description="New bookings created"
        icon={Calendar}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        href="/bookings"
      />
      <StatCard
        label="Upcoming"
        value={stats.upcomingBookings}
        description="Active appointments"
        icon={CalendarCheck}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        href="/bookings?filter=upcoming"
      />
      <StatCard
        label="Today"
        value={stats.todayBookings}
        description="Appointments today"
        icon={Clock}
        iconBg="bg-purple-50"
        iconColor="text-purple-600"
        href="/bookings?filter=today"
      />
      <StatCard
        label="Pending"
        value={stats.pendingBookings}
        description="Awaiting confirmation"
        icon={AlertTriangle}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        valueColor={stats.pendingBookings > 0 ? 'text-amber-600' : undefined}
        href="/bookings?filter=pending"
      />
      <StatCard
        label="Confirmed"
        value={stats.confirmedBookings}
        description="Customer verified"
        icon={CheckCircle2}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        valueColor="text-emerald-600"
        href="/bookings?filter=confirmed"
      />
      <StatCard
        label="Completed"
        value={stats.completedBookings}
        description="Appointments done"
        icon={TrendingUp}
        iconBg="bg-teal-50"
        iconColor="text-teal-600"
        href="/bookings?filter=completed"
      />
      <StatCard
        label="No-Show Rate"
        value={`${stats.noShowRate}%`}
        description={`${stats.noShows} no-show${stats.noShows !== 1 ? 's' : ''} total`}
        icon={UserX}
        iconBg="bg-red-50"
        iconColor="text-red-500"
        valueColor={stats.noShowRate > 5 ? 'text-red-600' : stats.noShowRate > 0 ? 'text-amber-600' : undefined}
        href="/bookings?filter=no_show"
      />
      <StatCard
        label="Est. Revenue"
        value={`$${stats.estimatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        description="From completed bookings"
        icon={DollarSign}
        iconBg="bg-green-50"
        iconColor="text-green-600"
        valueColor="text-green-700"
      />
    </div>
  );
}
