'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { EventFormModal } from './EventModal';
import { useCalendarStore } from '@/store/calendarStore';

export function CalendarHeader() {
  const { selectedMonth, setSelectedMonth, fetchMonthEvents } = useCalendarStore();
  const [showNewEvent, setShowNewEvent] = useState(false);

  const navigate = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' ? subMonths(selectedMonth, 1) : addMonths(selectedMonth, 1);
    setSelectedMonth(newMonth);
    fetchMonthEvents(newMonth);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedMonth(today);
    fetchMonthEvents(today);
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{format(selectedMonth, 'MMMM yyyy')}</h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowNewEvent(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New event
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('prev')} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('next')} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EventFormModal open={showNewEvent} onClose={() => setShowNewEvent(false)} />
    </>
  );
}
