'use client';

import * as React from 'react';
import { completeOnboardingAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { BUSINESS_TYPES } from '@/lib/constants';
import { COMMON_TIMEZONES } from '@/lib/timezone';
import { Building2, Globe, Link2, Sparkles, Clock, ArrowRight } from 'lucide-react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export default function OnboardingPage() {
  const [state, formAction, isPending] = React.useActionState(completeOnboardingAction, null);

  const [businessName, setBusinessName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = React.useState(false);
  const [selectedTimezone, setSelectedTimezone] = React.useState('America/New_York');

  // Try auto-detecting client timezone on mount
  React.useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setSelectedTimezone(detected);
      }
    } catch {
      // fallback to America/New_York
    }
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBusinessName(val);
    if (!isSlugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true);
    // enforce lowercase alphanumeric and hyphens
    const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(cleaned);
  };

  // Ensure timezone options include the detected timezone if not already in list
  const timezoneOptions = React.useMemo<{ value: string; label: string }[]>(() => {
    const list: { value: string; label: string }[] = COMMON_TIMEZONES.map((tz) => ({
      value: tz.value,
      label: tz.label,
    }));
    if (!list.some((tz) => tz.value === selectedTimezone)) {
      list.unshift({ value: selectedTimezone, label: `${selectedTimezone} (Auto-detected)` });
    }
    return list;
  }, [selectedTimezone]);

  return (
    <Card className="shadow-lg border-zinc-200 max-w-xl mx-auto">
      <CardHeader className="space-y-1 text-center pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mx-auto mb-2">
          <Sparkles className="h-3.5 w-3.5" /> Initial Setup • Step 1 of 1
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900">
          Set up your business profile
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Tell us about your services so we can create your personalized public booking page.
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-5">
          {state?.error && (
            <Alert variant="error" title="Could not complete setup">
              {state.error}
            </Alert>
          )}

          {/* Business Name */}
          <Input
            id="onboarding-business-name"
            name="name"
            label="Business Name"
            placeholder="e.g. Apex Personal Training, Bloom Salon"
            required
            value={businessName}
            onChange={handleNameChange}
            prefixElement={<Building2 className="h-4 w-4" />}
            helperText="The name shown to customers on your booking page and emails"
          />

          {/* Business Type */}
          <Select
            id="onboarding-business-type"
            name="business_type"
            label="Business Category"
            required
            defaultValue="general"
            options={BUSINESS_TYPES}
            helperText="Helps tailor reminder cadence and templates for your industry"
          />

          {/* Timezone */}
          <Select
            id="onboarding-timezone"
            name="timezone"
            label="Business Timezone"
            required
            value={selectedTimezone}
            onChange={(e) => setSelectedTimezone(e.target.value)}
            options={timezoneOptions}
            helperText="All appointments will be displayed and scheduled relative to this timezone"
          />

          {/* Booking Slug */}
          <div className="space-y-1.5">
            <Input
              id="onboarding-slug"
              name="booking_slug"
              label="Public Booking Link Slug"
              placeholder="e.g. apex-pt"
              required
              value={slug}
              onChange={handleSlugChange}
              prefixElement={<Link2 className="h-4 w-4" />}
              helperText="Only lowercase letters, numbers, and hyphens (min 3 chars)"
            />
            {slug && (
              <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-2.5 text-xs text-emerald-950 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="text-zinc-500">Your public link:</span>
                <span className="font-mono font-medium text-emerald-700 truncate">
                  /book/{slug || 'your-slug'}
                </span>
              </div>
            )}
          </div>

          {/* Cancellation Policy */}
          <Textarea
            id="onboarding-cancellation-policy"
            name="cancellation_policy"
            label="Cancellation Policy (Optional)"
            placeholder="e.g. Please cancel or reschedule at least 24 hours in advance."
            defaultValue="Please provide at least 24 hours notice for cancellations or reschedule requests to allow another client to book that slot."
            rows={3}
            helperText="Shown to clients during booking and included in confirmation emails"
          />
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-2">
          <Button
            id="onboarding-submit-button"
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isPending}
          >
            Create Business & Open Dashboard
            {!isPending && <ArrowRight className="h-4 w-4 ml-1" />}
          </Button>

          <p className="text-center text-xs text-zinc-500">
            You can always update these settings anytime from your dashboard.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
