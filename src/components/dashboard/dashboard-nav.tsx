'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOutAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  LayoutDashboard,
  Briefcase,
  Clock,
  Calendar,
  Settings,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import type { Business } from '@/types';
import type { AuthUser } from '@/lib/auth';

interface DashboardNavProps {
  user: AuthUser;
  business: Business;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/services', label: 'Services', icon: Briefcase },
  { href: '/availability', label: 'Availability', icon: Clock },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardNav({ user, business, children }: DashboardNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const publicBookingPath = `/book/${business.booking_slug}`;

  const copyBookingLink = async () => {
    try {
      const fullUrl = `${window.location.origin}${publicBookingPath}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const navLinks = (
    <nav className="space-y-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Icon
              className={`h-4 w-4 ${
                isActive ? 'text-emerald-600' : 'text-zinc-400'
              }`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200 bg-white shrink-0 justify-between">
        <div>
          {/* Logo */}
          <div className="h-16 px-6 border-b border-zinc-200 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="font-bold text-base text-zinc-900 tracking-tight">
                NoShowGuard
              </span>
            </Link>
          </div>

          {/* Business Info Card */}
          <div className="px-4 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">
              Active Business
            </div>
            <div className="font-semibold text-sm text-zinc-900 truncate">
              {business.name}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] uppercase font-mono capitalize">
                {business.business_type}
              </Badge>
              <span className="text-xs text-zinc-400 truncate">
                {business.timezone.split('/')[1]?.replace('_', ' ') || business.timezone}
              </span>
            </div>
          </div>

          {/* Nav Items */}
          {navLinks}
        </div>

        {/* User & Logout */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/60">
          <div className="text-xs text-zinc-500 truncate mb-2">
            Signed in as <span className="font-medium text-zinc-800">{user.email}</span>
          </div>
          <form action={signOutAction}>
            <Button
              id="sidebar-logout-button"
              type="submit"
              variant="outline"
              size="sm"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between h-16 px-4 border-b border-zinc-200 bg-white sticky top-0 z-20">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="font-bold text-base text-zinc-900">NoShowGuard</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-10 bg-black/40 backdrop-blur-xs flex flex-col justify-between">
          <div className="bg-white border-b border-zinc-200 p-4 space-y-4 shadow-xl">
            <div className="border-b border-zinc-100 pb-3">
              <div className="font-semibold text-sm text-zinc-900">{business.name}</div>
              <div className="text-xs text-zinc-500">{user.email}</div>
            </div>
            {navLinks}
            <div className="pt-2">
              <form action={signOutAction}>
                <Button
                  id="mobile-logout-button"
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with Public Booking link */}
        <div className="h-16 border-b border-zinc-200 bg-white px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="h-4 w-4 text-zinc-400 shrink-0" />
            <span className="text-xs sm:text-sm text-zinc-500 hidden sm:inline">Booking Link:</span>
            <span className="text-xs sm:text-sm font-mono font-medium text-zinc-800 truncate">
              /book/{business.booking_slug}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              id="copy-booking-link-btn"
              variant="outline"
              size="sm"
              onClick={copyBookingLink}
              className="text-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy Link
                </>
              )}
            </Button>

            <Link href={publicBookingPath} target="_blank">
              <Button size="sm" variant="secondary" className="text-xs">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                View Page
              </Button>
            </Link>
          </div>
        </div>

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
