import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ArrowLeft } from 'lucide-react';

export default function AvailabilityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Availability</h1>
        <p className="text-sm text-zinc-500">
          Configure weekly business hours and available time windows.
        </p>
      </div>

      <Card className="text-center py-12">
        <CardContent className="space-y-4 max-w-md mx-auto">
          <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <Clock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg">Weekly Schedule Coming in Stage 4</CardTitle>
            <CardDescription>
              In Stage 4, you will set recurring weekly availability rules (Monday–Sunday) and custom start/end time windows.
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
