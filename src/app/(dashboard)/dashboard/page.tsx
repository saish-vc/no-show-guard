import * as React from 'react';
import Link from 'next/link';
import { getAuthSession } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  UserX,
  DollarSign,
  Share2,
  Briefcase,
  Sparkles,
} from 'lucide-react';

export default async function DashboardPage() {
  const { user, business } = await getAuthSession();

  if (!business) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" /> Business Profile Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome to {business.name}
          </h1>
          <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            Your appointment booking system is ready. Protect your schedule from costly no-shows with automated 24h & 2h reminders.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href={`/book/${business.booking_slug}`} target="_blank">
              <Button size="md" className="bg-white text-indigo-900 hover:bg-indigo-50 border-0">
                <Share2 className="h-4 w-4 mr-2 text-indigo-600" />
                Preview Public Booking Page
              </Button>
            </Link>
            <Link href="/services">
              <Button size="md" variant="secondary" className="bg-indigo-700/50 hover:bg-indigo-700 text-white border-indigo-600">
                <Briefcase className="h-4 w-4 mr-2" />
                Add Your Services
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Setup Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-zinc-900">
            Setup Progress
          </CardTitle>
          <CardDescription>
            Complete these steps to start accepting client bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm text-emerald-950">1. Business Profile</div>
                <div className="text-xs text-emerald-800">Completed (slug: /{business.booking_slug})</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 bg-white">
              <div className="h-5 w-5 rounded-full border-2 border-indigo-600 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0 mt-0.5">
                2
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-sm text-zinc-900">2. Create Services</div>
                <div className="text-xs text-zinc-500">Define services, prices, and durations</div>
                <Link href="/services" className="inline-flex text-xs font-medium text-indigo-600 hover:underline">
                  Configure services →
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 bg-white">
              <div className="h-5 w-5 rounded-full border-2 border-zinc-300 flex items-center justify-center text-zinc-400 text-xs font-bold shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-sm text-zinc-900">3. Set Weekly Hours</div>
                <div className="text-xs text-zinc-500">Set availability windows for each day</div>
                <Link href="/availability" className="inline-flex text-xs font-medium text-indigo-600 hover:underline">
                  Set hours →
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Row */}
      <div>
        <h2 className="text-base font-semibold text-zinc-900 mb-4">
          Appointment Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">Total Bookings</p>
                <p className="text-2xl font-bold text-zinc-900 mt-1">0</p>
                <p className="text-xs text-zinc-400 mt-0.5">All time appointments</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Calendar className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">Confirmed</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">0</p>
                <p className="text-xs text-zinc-400 mt-0.5">Customer verified</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">No-Show Rate</p>
                <p className="text-2xl font-bold text-zinc-900 mt-1">0.0%</p>
                <p className="text-xs text-zinc-400 mt-0.5">Target: &lt; 5%</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <UserX className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">Est. Revenue</p>
                <p className="text-2xl font-bold text-zinc-900 mt-1">$0.00</p>
                <p className="text-xs text-zinc-400 mt-0.5">Completed appointments</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Business Profile Details Card */}
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
              <dd className="font-mono font-semibold text-indigo-600 mt-1">/{business.booking_slug}</dd>
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
