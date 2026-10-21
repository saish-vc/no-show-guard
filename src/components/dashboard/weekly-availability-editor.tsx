'use client';

import * as React from 'react';
import { saveWeeklyAvailabilityAction } from '@/app/actions/availability';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { Clock, Save, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import type { AvailabilityRule } from '@/types';

interface WeeklyAvailabilityEditorProps {
  initialRules: AvailabilityRule[];
}

interface DaySchedule {
  day_of_week: number;
  is_active: boolean;
  start_time: string;
  end_time: string;
}

const DEFAULT_START = '09:00';
const DEFAULT_END = '17:00';

function buildInitialSchedule(rules: AvailabilityRule[]): DaySchedule[] {
  return DAYS_OF_WEEK.map((day) => {
    const existing = rules.find((r) => r.day_of_week === day.value);
    if (existing) {
      return {
        day_of_week: day.value,
        is_active: existing.is_active,
        start_time: existing.start_time.slice(0, 5), // HH:MM
        end_time: existing.end_time.slice(0, 5),
      };
    }
    // Default: weekdays active 9–5, weekends inactive
    const isWeekday = day.value >= 1 && day.value <= 5;
    return {
      day_of_week: day.value,
      is_active: false,
      start_time: DEFAULT_START,
      end_time: DEFAULT_END,
    };
  });
}

export function WeeklyAvailabilityEditor({ initialRules }: WeeklyAvailabilityEditorProps) {
  const { toast } = useToast();
  const [schedule, setSchedule] = React.useState<DaySchedule[]>(() =>
    buildInitialSchedule(initialRules)
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const updateDay = (dayOfWeek: number, update: Partial<DaySchedule>) => {
    setSchedule((prev) =>
      prev.map((d) => (d.day_of_week === dayOfWeek ? { ...d, ...update } : d))
    );
    setSuccess(false);
    setError(null);
  };

  const resetToDefaults = () => {
    const defaults: DaySchedule[] = DAYS_OF_WEEK.map((day) => ({
      day_of_week: day.value,
      is_active: day.value >= 1 && day.value <= 5, // Mon–Fri
      start_time: DEFAULT_START,
      end_time: DEFAULT_END,
    }));
    setSchedule(defaults);
    setSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Validate time order on client side
    for (const day of schedule) {
      if (day.is_active && day.start_time >= day.end_time) {
        const dayName = DAYS_OF_WEEK.find((d) => d.value === day.day_of_week)?.label || 'Unknown';
        setError(`${dayName}: End time must be later than start time.`);
        setSaving(false);
        return;
      }
    }

    // Only send active days
    const activeRules = schedule
      .filter((d) => d.is_active)
      .map((d) => ({
        day_of_week: d.day_of_week,
        start_time: d.start_time,
        end_time: d.end_time,
        is_active: true,
      }));

    const result = await saveWeeklyAvailabilityAction(activeRules);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      setSuccess(true);
      toast.success('Weekly availability schedule saved successfully!');
    }
    setSaving(false);
  };

  const activeDaysCount = schedule.filter((d) => d.is_active).length;

  const totalWeeklyHours = schedule
    .filter((d) => d.is_active && d.start_time < d.end_time)
    .reduce((acc, d) => {
      const [sh, sm] = d.start_time.split(':').map(Number);
      const [eh, em] = d.end_time.split(':').map(Number);
      return acc + (eh * 60 + em - (sh * 60 + sm)) / 60;
    }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Weekly Availability</h1>
          <p className="text-sm text-zinc-500">
            Set your weekly working hours and booking windows. Customers can only book appointments during active hours.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset to 9–5 Weekdays
          </Button>
          <Button id="save-availability-btn" onClick={handleSave} isLoading={saving} className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
            <Save className="h-4 w-4 mr-2" />
            Save Availability
          </Button>
        </div>
      </div>

      {/* Stitch KPI Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Open Days</p>
              <p className="text-2xl font-bold text-zinc-900 mt-0.5">{activeDaysCount} <span className="text-sm font-normal text-zinc-500">/ 7 days</span></p>
              <p className="text-[11px] text-zinc-400">Weekly active schedule</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Available Hours</p>
              <p className="text-2xl font-bold text-zinc-900 mt-0.5">{totalWeeklyHours.toFixed(1)} <span className="text-sm font-normal text-zinc-500">hrs/week</span></p>
              <p className="text-[11px] text-zinc-400">Total bookable time capacity</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Slot Generation</p>
              <p className="text-2xl font-bold text-zinc-900 mt-0.5">Dynamic</p>
              <p className="text-[11px] text-zinc-400">Tailored to service duration</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && (
        <Alert variant="success" title="Availability saved">
          Your weekly schedule has been updated. {activeDaysCount} day{activeDaysCount !== 1 ? 's' : ''} are now accepting bookings.
        </Alert>
      )}

      {/* Weekly Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly Schedule</CardTitle>
          <CardDescription>
            Toggle days on/off and set start & end times for each active day
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="divide-y divide-zinc-100">
            {schedule.map((day) => {
              const dayInfo = DAYS_OF_WEEK.find((d) => d.value === day.day_of_week)!;
              const timeError = day.is_active && day.start_time >= day.end_time;

              return (
                <div
                  key={day.day_of_week}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 py-4 first:pt-2 last:pb-2 transition-opacity ${
                    !day.is_active ? 'opacity-50' : ''
                  }`}
                >
                  {/* Day toggle + label */}
                  <div className="flex items-center gap-3 sm:w-44 shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.is_active}
                        onChange={(e) =>
                          updateDay(day.day_of_week, { is_active: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                    </label>
                    <span
                      className={`font-medium text-sm ${
                        day.is_active ? 'text-zinc-900' : 'text-zinc-400'
                      }`}
                    >
                      {dayInfo.label}
                    </span>
                  </div>

                  {/* Time inputs */}
                  {day.is_active ? (
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-zinc-400 shrink-0 hidden sm:block" />
                        <input
                          type="time"
                          value={day.start_time}
                          onChange={(e) =>
                            updateDay(day.day_of_week, { start_time: e.target.value })
                          }
                          className={`h-9 px-3 text-sm rounded-lg border ${
                            timeError
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-zinc-300 focus:ring-emerald-500'
                          } bg-white focus:outline-none focus:ring-2 transition-colors w-[130px]`}
                        />
                      </div>
                      <span className="text-sm text-zinc-400">to</span>
                      <input
                        type="time"
                        value={day.end_time}
                        onChange={(e) =>
                          updateDay(day.day_of_week, { end_time: e.target.value })
                        }
                        className={`h-9 px-3 text-sm rounded-lg border ${
                          timeError
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-zinc-300 focus:ring-emerald-500'
                        } bg-white focus:outline-none focus:ring-2 transition-colors w-[130px]`}
                      />
                      {timeError && (
                        <span className="text-xs text-red-600 ml-2">
                          End time must be after start time
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 text-sm text-zinc-400 italic pl-1">
                      Closed — toggle on to accept bookings
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-zinc-900">
                {activeDaysCount} day{activeDaysCount !== 1 ? 's' : ''} accepting bookings
              </p>
              <p className="text-xs text-zinc-500">
                {activeDaysCount > 0
                  ? schedule
                      .filter((d) => d.is_active)
                      .map(
                        (d) =>
                          `${DAYS_OF_WEEK.find((dw) => dw.value === d.day_of_week)?.short} ${d.start_time}–${d.end_time}`
                      )
                      .join(' · ')
                  : 'No days configured — clients cannot book yet'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
