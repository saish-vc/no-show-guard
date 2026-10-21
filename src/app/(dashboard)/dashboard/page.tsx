import * as React from 'react';
import Link from 'next/link';
import { getAuthSession } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardStatsClient } from '@/components/dashboard/dashboard-stats-client';
import {
  Calendar,
  CheckCircle2,
  ArrowRight,
  Share2,
  Briefcase,
  Sparkles,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export default async function DashboardPage() {
  const { user, business } = await getAuthSession();

  if (!business) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-violet-950 p-6 sm:p-8 text-white shadow-lg">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" /> Business Profile Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {business.name}
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Manage your appointments, track no-shows, and keep your schedule running smoothly with automated reminders.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href="/bookings">
              <Button size="md" className="bg-white text-emerald-900 hover:bg-emerald-50 border-0">
                <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
                View All Bookings
              </Button>
            </Link>
            <Link href={`/book/${business.booking_slug}`} target="_blank">
              <Button size="md" variant="secondary" className="bg-emerald-700/50 hover:bg-emerald-700 text-white border-emerald-600">
                <Share2 className="h-4 w-4 mr-2" />
                Public Booking Page
                <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900">
            Appointment Overview
          </h2>
          <Link href="/bookings" className="text-xs text-emerald-600 hover:text-emerald-800 font-medium inline-flex items-center gap-1">
            All Bookings <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <DashboardStatsClient />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/services" className="block group">
          <Card className="p-5 hover:border-emerald-200 hover:shadow-md transition-all h-full">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-sm text-zinc-900 group-hover:text-emerald-700 transition-colors">
                  Manage Services
                </h3>
                <p className="text-xs text-zinc-500">
                  Create, edit, and toggle your service offerings
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-300 group-hover:text-emerald-500 transition-colors shrink-0 mt-1" />
            </div>
          </Card>
        </Link>

        <Link href="/availability" className="block group">
          <Card className="p-5 hover:border-emerald-200 hover:shadow-md transition-all h-full">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-sm text-zinc-900 group-hover:text-emerald-700 transition-colors">
                  Set Availability
                </h3>
                <p className="text-xs text-zinc-500">
                  Configure your weekly working hours
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-300 group-hover:text-emerald-500 transition-colors shrink-0 mt-1" />
            </div>
          </Card>
        </Link>

        <Link href="/settings" className="block group">
          <Card className="p-5 hover:border-emerald-200 hover:shadow-md transition-all h-full">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-sm text-zinc-900 group-hover:text-emerald-700 transition-colors">
                  Business Settings
                </h3>
                <p className="text-xs text-zinc-500">
                  Update your business profile and policies
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-300 group-hover:text-emerald-500 transition-colors shrink-0 mt-1" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Business Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-zinc-900">
            Business Details
          </CardTitle>
          <CardDescription>
            Configuration stored for customer bookings and reminder timestamps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div>
              <dt className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Business Name</dt>
              <dd className="font-semibold text-zinc-900 mt-1">{business.name}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Category</dt>
              <dd className="font-semibold text-zinc-900 mt-1 capitalize">{business.business_type}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Timezone</dt>
              <dd className="font-semibold text-zinc-900 mt-1">{business.timezone}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Booking Slug</dt>
              <dd className="font-mono font-semibold text-emerald-600 mt-1">/{business.booking_slug}</dd>
            </div>
          </dl>
          {business.cancellation_policy && (
            <div className="mt-6 pt-4 border-t border-zinc-100">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Cancellation Policy</span>
              <p className="text-sm text-zinc-700 mt-1 italic">
                &ldquo;{business.cancellation_policy}&rdquo;
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
