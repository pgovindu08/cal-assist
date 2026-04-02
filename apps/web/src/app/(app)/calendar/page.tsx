'use client';

import { useEffect } from 'react';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { useCalendarStore } from '@/store/calendarStore';

export default function CalendarPage() {
  const { view, selectedMonth, selectedDate, fetchMonthEvents, fetchWeekEvents, fetchDayEvents } = useCalendarStore();

  useEffect(() => {
    if (view === 'month') fetchMonthEvents(selectedMonth);
    else if (view === 'week') fetchWeekEvents(selectedDate);
    else fetchDayEvents(selectedDate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full flex-col">
      <CalendarHeader />
      {view === 'month' && <CalendarGrid />}
      {view === 'week' && <WeekView />}
      {view === 'day' && <DayView />}
    </div>
  );
}
