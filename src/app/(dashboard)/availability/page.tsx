import { getAvailabilityRules } from '@/app/actions/availability';
import { WeeklyAvailabilityEditor } from '@/components/dashboard/weekly-availability-editor';

export default async function AvailabilityPage() {
  const rules = await getAvailabilityRules();

  return <WeeklyAvailabilityEditor initialRules={rules} />;
}
