import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck, CalendarCheck, Clock, BellRing } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition-colors">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg text-zinc-900 tracking-tight">
              {APP_NAME}
            </span>
          </Link>
          <div className="text-sm text-zinc-500">
            Automated appointment protection
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-indigo-500" /> 24h & 2h reminders
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarCheck className="h-3.5 w-3.5 text-emerald-500" /> Double-booking defense
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
