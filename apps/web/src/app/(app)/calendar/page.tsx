'use client';

import { useEffect } from 'react';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { useCalendarStore } from '@/store/calendarStore';

export default function CalendarPage() {
  const { selectedMonth, fetchMonthEvents } = useCalendarStore();

  useEffect(() => {
    fetchMonthEvents(selectedMonth);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full flex-col">
      <CalendarHeader />
      <CalendarGrid />
    </div>
  );
}
