'use client';

import { useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday, isSameDay,
} from 'date-fns';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EventCard } from './EventCard';
import { EventFormModal, EventDetailModal } from './EventModal';
import { useCalendarStore, type CalEvent } from '@/store/calendarStore';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid() {
  const { selectedMonth, events, setView, setSelectedDate, fetchDayEvents } = useCalendarStore();
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });

  const getEventsForDay = (day: Date) =>
    events
      .filter((e) => isSameDay(new Date(e.startDateTime), day))
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  const goToDay = (day: Date) => {
    setSelectedDate(day);
    fetchDayEvents(day);
    setView('day');
  };

  return (
    <>
      <div className="flex-1 overflow-auto">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border sticky top-0 bg-background z-10">
          {DAY_LABELS.map((label) => (
            <div key={label} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {label}
            </div>
          ))}
        </div>

        {/* Grid cells */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, selectedMonth);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'group min-h-[110px] border-b border-r border-border p-1.5 cursor-pointer hover:bg-accent/30 transition-colors',
                  !isCurrentMonth && 'bg-muted/20'
                )}
                onClick={() => goToDay(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                      isCurrentDay && 'bg-primary text-primary-foreground',
                      !isCurrentDay && !isCurrentMonth && 'text-muted-foreground/50',
                      !isCurrentDay && isCurrentMonth && 'text-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-accent p-0.5"
                    onClick={(e) => { e.stopPropagation(); setCreateDate(day); }}
                    aria-label="Add event"
                  >
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>

                <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                  {dayEvents.slice(0, 3).map((event) => (
                    <div key={event.id} onClick={() => setSelectedEvent(event)}>
                      <EventCard event={event} compact />
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <EventFormModal
        open={Boolean(createDate)}
        onClose={() => setCreateDate(null)}
        defaultDate={createDate ?? undefined}
      />

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={(e) => { setSelectedEvent(null); setEditingEvent(e); }}
      />

      <EventFormModal
        open={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        event={editingEvent ?? undefined}
      />
    </>
  );
}
