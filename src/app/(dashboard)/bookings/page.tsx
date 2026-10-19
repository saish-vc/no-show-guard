import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Bookings</h1>
        <p className="text-sm text-zinc-500">
          View and manage all customer appointments and confirmation statuses.
        </p>
      </div>

      <Card className="text-center py-12">
        <CardContent className="space-y-4 max-w-md mx-auto">
          <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg">Bookings Feed Coming in Stage 8</CardTitle>
            <CardDescription>
              In Stage 8, you will see all real-time bookings, filter by status, and mark appointments as Completed, No-Show, or Cancelled.
            </CardDescription>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
