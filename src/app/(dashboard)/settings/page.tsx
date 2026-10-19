import * as React from 'react';
import Link from 'next/link';
import { getAuthSession } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, ArrowLeft } from 'lucide-react';

export default async function SettingsPage() {
  const { business } = await getAuthSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500">
          Manage your business profile, timezone, and cancellation rules.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Profile</CardTitle>
          <CardDescription>Your registered details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div><strong className="text-zinc-600">Business Name:</strong> {business?.name}</div>
          <div><strong className="text-zinc-600">Category:</strong> {business?.business_type}</div>
          <div><strong className="text-zinc-600">Timezone:</strong> {business?.timezone}</div>
          <div><strong className="text-zinc-600">Public Slug:</strong> /{business?.booking_slug}</div>
          <div><strong className="text-zinc-600">Cancellation Policy:</strong> {business?.cancellation_policy || 'None set'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
