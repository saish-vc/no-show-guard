import Link from 'next/link';
import {
  ShieldCheck,
  CalendarCheck,
  Clock,
  BellRing,
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between">
      {/* Navigation */}
      <header className="border-b border-zinc-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg text-zinc-900 tracking-tight">
              {APP_NAME}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 sm:py-28 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Stop losing revenue to empty slots
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Cut appointment no-shows by <span className="text-indigo-600">80%</span> with zero extra effort
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-zinc-600 leading-relaxed">
            The lightweight booking and automated reminder engine for salons, tutors, gyms, and consultants. Clients confirm with one tap; you never sit waiting for an empty chair.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 shadow-md">
                Get Your Booking Link
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-6">
                Owner Login
              </Button>
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free tier included
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Automated 24h & 2h reminders
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 1-tap customer confirmations
            </span>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="border-t border-zinc-100 bg-zinc-50/60 py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                Built specifically for service businesses
              </h2>
              <p className="text-zinc-600 text-sm">
                Everything you need to safeguard your calendar without bloated software.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3 shadow-xs">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg text-zinc-900">Simple Public Booking</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Share your link anywhere. Clients select a service, date, and slot with zero friction on any mobile device.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3 shadow-xs">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <BellRing className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg text-zinc-900">2-Stage Reminders</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Automatic emails at 24 hours and 2 hours before the booking, complete with secure one-click confirmation links.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3 shadow-xs">
                <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg text-zinc-900">Instant Rescheduling</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  When plans change, clients reschedule directly from their email, freeing up their slot immediately for other customers.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold text-zinc-800">{APP_NAME}</span>
            <span>— The appointment no-show guard.</span>
          </div>
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
