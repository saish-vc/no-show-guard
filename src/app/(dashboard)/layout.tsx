import * as React from 'react';
import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, business } = await getAuthSession();

  // If unauthenticated, redirect to login
  if (!user) {
    redirect('/login');
  }

  // If authenticated but no business created yet, redirect to onboarding
  if (!business) {
    redirect('/onboarding');
  }

  return (
    <DashboardNav user={user} business={business}>
      {children}
    </DashboardNav>
  );
}
