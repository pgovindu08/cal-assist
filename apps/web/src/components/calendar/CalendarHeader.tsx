'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  startOfWeek, endOfWeek,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EventFormModal } from './EventModal';
import { useCalendarStore, type CalView } from '@/store/calendarStore';

const VIEW_LABELS: Record<CalView, string> = { month: 'Month', week: 'Week', day: 'Day' };

export function CalendarHeader() {
  const {
    view, setView,
    selectedMonth, setSelectedMonth, fetchMonthEvents,
    selectedDate, setSelectedDate, fetchWeekEvents, fetchDayEvents,
  } = useCalendarStore();
  const [showNewEvent, setShowNewEvent] = useState(false);

  const getTitle = () => {
    if (view === 'month') return format(selectedMonth, 'MMMM yyyy');
    if (view === 'week') {
      const ws = startOfWeek(selectedDate);
      const we = endOfWeek(selectedDate);
      return format(ws, 'MMM yyyy') === format(we, 'MMM yyyy')
        ? `${format(ws, 'MMM d')} – ${format(we, 'd, yyyy')}`
        : `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`;
    }
    return format(selectedDate, 'EEEE, MMMM d, yyyy');
  };

  const navigate = (dir: 'prev' | 'next') => {
    if (view === 'month') {
      const next = dir === 'prev' ? subMonths(selectedMonth, 1) : addMonths(selectedMonth, 1);
      setSelectedMonth(next);
      fetchMonthEvents(next);
    } else if (view === 'week') {
      const next = dir === 'prev' ? subWeeks(selectedDate, 1) : addWeeks(selectedDate, 1);
      setSelectedDate(next);
      fetchWeekEvents(next);
    } else {
      const next = dir === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1);
      setSelectedDate(next);
      fetchDayEvents(next);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedMonth(today);
    setSelectedDate(today);
    if (view === 'month') fetchMonthEvents(today);
    else if (view === 'week') fetchWeekEvents(today);
    else fetchDayEvents(today);
  };

  const switchView = (v: CalView) => {
    setView(v);
    const today = selectedDate;
    if (v === 'month') fetchMonthEvents(selectedMonth);
    else if (v === 'week') fetchWeekEvents(today);
    else fetchDayEvents(today);
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-6 py-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{getTitle()}</h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex overflow-hidden rounded-md border border-border text-sm">
            {(Object.keys(VIEW_LABELS) as CalView[]).map((v) => (
              <button
                key={v}
                onClick={() => switchView(v)}
                className={cn(
                  'px-3 py-1.5 transition-colors',
                  view === v
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                )}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>

          <Button size="sm" onClick={() => setShowNewEvent(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New event
          </Button>

          <Button variant="ghost" size="icon" onClick={() => navigate('prev')} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('next')} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EventFormModal open={showNewEvent} onClose={() => setShowNewEvent(false)} />
    </>
  );
}
