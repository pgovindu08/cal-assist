'use client';

import { useState } from 'react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCalendarStore, type CalEvent } from '@/store/calendarStore';
import { EventDetailModal, EventFormModal } from './EventModal';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CELL_H = 64;

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

export function DayView() {
  const { selectedDate, events } = useCalendarStore();
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [createDate, setCreateDate] = useState<Date | null>(null);

  const dayEvents = events
    .filter((e) => !e.allDay && format(new Date(e.startDateTime), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  const allDayEvents = events.filter(
    (e) => e.allDay && format(new Date(e.startDateTime), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const handleSlotClick = (hour: number) => {
    const d = new Date(selectedDate);
    d.setHours(hour, 0, 0, 0);
    setCreateDate(d);
  };

  return (
    <>
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Day header */}
        <div className="border-b border-border px-6 py-3 shrink-0">
          <div className="flex items-center gap-4">
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold', isToday(selectedDate) ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
              {format(selectedDate, 'd')}
            </div>
            <div>
              <p className="font-semibold">{format(selectedDate, 'EEEE')}</p>
              <p className="text-sm text-muted-foreground">{format(selectedDate, 'MMMM yyyy')}</p>
            </div>
          </div>

          {/* All-day events */}
          {allDayEvents.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {allDayEvents.map((e) => (
                <div
                  key={e.id}
                  onClick={() => setSelectedEvent(e)}
                  className="rounded px-2 py-0.5 text-xs font-medium text-white cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: e.color }}
                >
                  {e.title}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable time grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-[64px_1fr]">
            {/* Hour labels */}
            <div>
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

            {/* Event column */}
            <div
              className="relative border-l border-border"
              style={{ height: `${CELL_H * 24}px` }}
            >
              {/* Hour slot backgrounds */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-b border-border hover:bg-accent/20 cursor-pointer transition-colors"
                  style={{ top: `${h * CELL_H}px`, height: `${CELL_H}px` }}
                  onClick={() => handleSlotClick(h)}
                />
              ))}

              {/* Events */}
              {dayEvents.map((event) => {
                const { top, height } = getEventPosition(event);
                return (
                  <div
                    key={event.id}
                    className="absolute left-2 right-2 rounded-md px-2 py-1 text-white overflow-hidden cursor-pointer hover:opacity-90 z-10"
                    style={{ top, height, backgroundColor: event.color, minHeight: '24px' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                  >
                    <p className="text-sm font-semibold truncate leading-tight">{event.title}</p>
                    {height > 36 && (
                      <p className="text-xs opacity-80">
                        {format(new Date(event.startDateTime), 'h:mm a')} – {format(new Date(event.endDateTime), 'h:mm a')}
                      </p>
                    )}
                    {height > 60 && event.location && (
                      <p className="text-xs opacity-70 truncate">{event.location}</p>
                    )}
                  </div>
                );
              })}
            </div>
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
