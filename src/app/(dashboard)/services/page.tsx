import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Plus, ArrowLeft } from 'lucide-react';

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Services</h1>
          <p className="text-sm text-zinc-500">
            Define services, pricing, and durations for client bookings.
          </p>
        </div>
        <Button disabled className="opacity-75">
          <Plus className="h-4 w-4 mr-2" />
          Add Service (Stage 3)
        </Button>
      </div>

      <Card className="text-center py-12">
        <CardContent className="space-y-4 max-w-md mx-auto">
          <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg">Services Management Coming in Stage 3</CardTitle>
            <CardDescription>
              In Stage 3, you will create, edit, price, and toggle active status for all your bookable services.
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
