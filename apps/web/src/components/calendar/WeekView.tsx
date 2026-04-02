'use client';

import { useState } from 'react';
import {
  startOfWeek, endOfWeek, eachDayOfInterval,
  format, isToday, isSameDay,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useCalendarStore, type CalEvent } from '@/store/calendarStore';
import { EventDetailModal, EventFormModal } from './EventModal';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CELL_H = 64; // px per hour

function formatHour(h: number) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function getEventPosition(event: CalEvent): { top: number; height: number } {
  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);
  const startMins = start.getHours() * 60 + start.getMinutes();
  const endMins = end.getHours() * 60 + end.getMinutes();
  const durationMins = Math.max(endMins - startMins, 30);
  return {
    top: (startMins / 60) * CELL_H,
    height: (durationMins / 60) * CELL_H,
  };
}

export function WeekView() {
  const { selectedDate, events, setView, setSelectedDate, fetchDayEvents } = useCalendarStore();
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [createDate, setCreateDate] = useState<Date | null>(null);

  const days = eachDayOfInterval({
    start: startOfWeek(selectedDate),
    end: endOfWeek(selectedDate),
  });

  const getEventsForDay = (day: Date) =>
    events
      .filter((e) => !e.allDay && isSameDay(new Date(e.startDateTime), day))
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  const getAllDayEventsForDay = (day: Date) =>
    events.filter((e) => e.allDay && isSameDay(new Date(e.startDateTime), day));

  const handleSlotClick = (day: Date, hour: number) => {
    const d = new Date(day);
    d.setHours(hour, 0, 0, 0);
    setCreateDate(d);
  };

  return (
    <>
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border sticky top-0 bg-background z-10 shrink-0">
          <div /> {/* time gutter */}
          {days.map((day) => {
            const allDayEvents = getAllDayEventsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={cn('border-l border-border text-center py-2 cursor-pointer hover:bg-accent/40 transition-colors', isToday(day) && 'bg-primary/5')}
                onClick={() => { setSelectedDate(day); fetchDayEvents(day); setView('day'); }}
              >
                <p className={cn('text-xs font-medium text-muted-foreground', isToday(day) && 'text-primary')}>
                  {format(day, 'EEE')}
                </p>
                <div
                  className={cn(
                    'mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                    isToday(day) ? 'bg-primary text-primary-foreground' : 'text-foreground'
                  )}
                >
                  {format(day, 'd')}
                </div>
                {/* All-day events */}
                {allDayEvents.length > 0 && (
                  <div className="px-1 pb-1 space-y-0.5">
                    {allDayEvents.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => setSelectedEvent(e)}
                        className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: e.color }}
                      >
                        {e.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scrollable time grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-[64px_repeat(7,1fr)]">
            {/* Hour labels */}
            <div className="relative">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="border-b border-border text-right pr-2 text-[11px] text-muted-foreground"
                  style={{ height: `${CELL_H}px`, lineHeight: '1', paddingTop: '4px' }}
                >
                  {h !== 0 && formatHour(h)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn('relative border-l border-border', isToday(day) && 'bg-primary/[0.02]')}
                  style={{ height: `${CELL_H * 24}px` }}
                >
                  {/* Hour slot backgrounds */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-b border-border hover:bg-accent/20 cursor-pointer transition-colors"
                      style={{ top: `${h * CELL_H}px`, height: `${CELL_H}px` }}
                      onClick={() => handleSlotClick(day, h)}
                    />
                  ))}

                  {/* Events */}
                  {dayEvents.map((event) => {
                    const { top, height } = getEventPosition(event);
                    return (
                      <div
                        key={event.id}
                        className="absolute left-1 right-1 rounded px-1.5 py-0.5 text-white overflow-hidden cursor-pointer hover:opacity-90 z-10"
                        style={{ top, height, backgroundColor: event.color, minHeight: '20px' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                      >
                        <p className="text-xs font-medium truncate leading-tight">{event.title}</p>
                        {height > 30 && (
                          <p className="text-[10px] opacity-80">
                            {format(new Date(event.startDateTime), 'h:mm a')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={(e) => { setSelectedEvent(null); setEditingEvent(e); }}
      />
      <EventFormModal open={Boolean(editingEvent)} onClose={() => setEditingEvent(null)} event={editingEvent ?? undefined} />
      <EventFormModal open={Boolean(createDate)} onClose={() => setCreateDate(null)} defaultDate={createDate ?? undefined} />
    </>
  );
}
