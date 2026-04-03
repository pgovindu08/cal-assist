'use client';

import { useState, useEffect, useRef } from 'react';
import {
  format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
  startOfDay, endOfDay, formatISO,
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, Plus, X, Trash2, Loader2,
  Calendar, List, LayoutGrid, Clock, MapPin, AlignLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCalendarStore, type CalEvent, type CreateEventInput } from '@/store/calendarStore';

// ── Constants ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CELL_H = 64; // px per hour

const COLOR_OPTIONS = [
  { label: 'Blue',   value: 'var(--cal-primary)' },
  { label: 'Green',  value: '#057A55' },
  { label: 'Red',    value: '#E02424' },
  { label: 'Purple', value: '#7E3AF2' },
  { label: 'Orange', value: '#D03801' },
  { label: 'Pink',   value: '#E74694' },
];

type CalView = 'month' | 'week' | 'day' | 'list';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatHour(h: number) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function getEventPosition(event: CalEvent) {
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

function toLocalDatetimeValue(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

// ── Event Chip (tiny pill used in month/week cells) ────────────────────────────

function EventChip({ event, onClick }: { event: CalEvent; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="w-full text-left truncate rounded-md px-2 py-0.5 text-[11px] font-medium text-white hover:opacity-80 transition-opacity"
      style={{ backgroundColor: `${event.color}cc` }}
    >
      {!event.allDay && (
        <span className="opacity-70 mr-1">
          {format(new Date(event.startDateTime), 'h:mm')}
        </span>
      )}
      {event.title}
    </button>
  );
}

// ── Month View ─────────────────────────────────────────────────────────────────

function MonthView({
  currentDate,
  events,
  onDayClick,
  onAddClick,
  onEventClick,
}: {
  currentDate: Date;
  events: CalEvent[];
  onDayClick: (day: Date) => void;
  onAddClick: (day: Date) => void;
  onEventClick: (event: CalEvent) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });

  const getEventsForDay = (day: Date) =>
    events
      .filter((e) => isSameDay(new Date(e.startDateTime), day))
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {DAY_LABELS.map((label) => (
          <div key={label} className="py-2.5 text-center text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1 overflow-auto">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className="group min-h-[110px] border-b border-r p-1.5 cursor-pointer transition-colors"
              style={{
                borderColor: 'rgba(255,255,255,0.07)',
                background: today ? 'rgba(var(--cal-primary-rgb),0.06)' : !inMonth ? 'rgba(255,255,255,0.015)' : 'transparent',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors"
                  style={{
                    background: today ? 'var(--cal-primary)' : 'transparent',
                    color: today ? 'white' : inMonth ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {format(day, 'd')}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onAddClick(day); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-0.5 hover:bg-white/10"
                  aria-label="Add event"
                >
                  <Plus className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                </button>
              </div>

              <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                {dayEvents.slice(0, 3).map((event) => (
                  <EventChip key={event.id} event={event} onClick={() => onEventClick(event)} />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week View ──────────────────────────────────────────────────────────────────

function WeekViewComponent({
  currentDate,
  events,
  onSlotClick,
  onEventClick,
}: {
  currentDate: Date;
  events: CalEvent[];
  onSlotClick: (date: Date) => void;
  onEventClick: (event: CalEvent) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to 7 AM on mount
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * CELL_H;
    }
  }, []);

  const days = eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) });

  const getTimedEvents = (day: Date) =>
    events.filter((e) => !e.allDay && isSameDay(new Date(e.startDateTime), day))
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  const getAllDayEvents = (day: Date) =>
    events.filter((e) => e.allDay && isSameDay(new Date(e.startDateTime), day));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers */}
      <div
        className="grid shrink-0 border-b"
        style={{
          gridTemplateColumns: '56px repeat(7, 1fr)',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        <div />
        {days.map((day) => {
          const allDay = getAllDayEvents(day);
          return (
            <div
              key={day.toISOString()}
              className="border-l text-center py-2"
              style={{ borderColor: 'rgba(255,255,255,0.07)', background: isToday(day) ? 'rgba(var(--cal-primary-rgb),0.06)' : 'transparent' }}
            >
              <p className="text-[11px] font-medium" style={{ color: isToday(day) ? 'var(--cal-primary)' : 'rgba(255,255,255,0.35)' }}>
                {format(day, 'EEE')}
              </p>
              <div
                className="mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  background: isToday(day) ? 'var(--cal-primary)' : 'transparent',
                  color: isToday(day) ? 'white' : 'rgba(255,255,255,0.85)',
                }}
              >
                {format(day, 'd')}
              </div>
              {allDay.length > 0 && (
                <div className="px-1 pb-1 space-y-0.5">
                  {allDay.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => onEventClick(e)}
                      className="w-full truncate rounded px-1 py-0.5 text-[10px] font-medium text-white hover:opacity-80"
                      style={{ backgroundColor: e.color }}
                    >
                      {e.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)' }}>
          {/* Hour labels */}
          <div className="relative">
            {HOURS.map((h) => (
              <div
                key={h}
                className="border-b text-right pr-2 text-[10px]"
                style={{
                  height: `${CELL_H}px`,
                  lineHeight: '1',
                  paddingTop: '4px',
                  borderColor: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.25)',
                }}
              >
                {h !== 0 && formatHour(h)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const timedEvents = getTimedEvents(day);
            return (
              <div
                key={day.toISOString()}
                className="relative border-l"
                style={{
                  height: `${CELL_H * 24}px`,
                  borderColor: 'rgba(255,255,255,0.07)',
                  background: isToday(day) ? 'rgba(var(--cal-primary-rgb),0.02)' : 'transparent',
                }}
              >
                {/* Hour slot backgrounds */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-b cursor-pointer transition-colors hover:bg-white/[0.03]"
                    style={{
                      top: `${h * CELL_H}px`,
                      height: `${CELL_H}px`,
                      borderColor: 'rgba(255,255,255,0.05)',
                    }}
                    onClick={() => {
                      const d = new Date(day);
                      d.setHours(h, 0, 0, 0);
                      onSlotClick(d);
                    }}
                  />
                ))}

                {/* Events */}
                {timedEvents.map((event) => {
                  const { top, height } = getEventPosition(event);
                  return (
                    <button
                      key={event.id}
                      className="absolute left-1 right-1 rounded-lg px-2 py-1 text-left text-white overflow-hidden z-10 hover:brightness-110 transition-all"
                      style={{ top, height, backgroundColor: event.color, minHeight: '20px', border: `1px solid ${event.color}88` }}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    >
                      <p className="text-[11px] font-semibold truncate leading-tight">{event.title}</p>
                      {height > 28 && (
                        <p className="text-[10px] opacity-75">
                          {format(new Date(event.startDateTime), 'h:mm a')}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Day View ───────────────────────────────────────────────────────────────────

function DayViewComponent({
  currentDate,
  events,
  onSlotClick,
  onEventClick,
}: {
  currentDate: Date;
  events: CalEvent[];
  onSlotClick: (date: Date) => void;
  onEventClick: (event: CalEvent) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * CELL_H;
  }, []);

  const timedEvents = events
    .filter((e) => !e.allDay && isSameDay(new Date(e.startDateTime), currentDate))
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  const allDayEvents = events.filter(
    (e) => e.allDay && isSameDay(new Date(e.startDateTime), currentDate)
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div
          className="px-6 py-2 border-b flex flex-wrap gap-2 shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <span className="text-xs self-center" style={{ color: 'rgba(255,255,255,0.3)' }}>All day</span>
          {allDayEvents.map((e) => (
            <button
              key={e.id}
              onClick={() => onEventClick(e)}
              className="rounded-full px-3 py-1 text-xs font-medium text-white hover:opacity-80"
              style={{ backgroundColor: e.color }}
            >
              {e.title}
            </button>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="relative" style={{ display: 'grid', gridTemplateColumns: '56px 1fr' }}>
          {/* Hour labels */}
          <div>
            {HOURS.map((h) => (
              <div
                key={h}
                className="border-b text-right pr-2 text-[10px]"
                style={{
                  height: `${CELL_H}px`,
                  lineHeight: '1',
                  paddingTop: '4px',
                  borderColor: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.25)',
                }}
              >
                {h !== 0 && formatHour(h)}
              </div>
            ))}
          </div>

          {/* Event column */}
          <div
            className="relative border-l"
            style={{ height: `${CELL_H * 24}px`, borderColor: 'rgba(255,255,255,0.07)' }}
          >
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-b cursor-pointer hover:bg-white/[0.03] transition-colors"
                style={{
                  top: `${h * CELL_H}px`,
                  height: `${CELL_H}px`,
                  borderColor: 'rgba(255,255,255,0.05)',
                }}
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setHours(h, 0, 0, 0);
                  onSlotClick(d);
                }}
              />
            ))}

            {timedEvents.map((event) => {
              const { top, height } = getEventPosition(event);
              return (
                <button
                  key={event.id}
                  className="absolute left-2 right-2 rounded-xl px-3 py-1.5 text-left text-white overflow-hidden z-10 hover:brightness-110 transition-all"
                  style={{ top, height, backgroundColor: event.color, minHeight: '24px' }}
                  onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                >
                  <p className="text-sm font-semibold leading-tight truncate">{event.title}</p>
                  {height > 36 && (
                    <p className="text-xs opacity-75 mt-0.5">
                      {format(new Date(event.startDateTime), 'h:mm a')} – {format(new Date(event.endDateTime), 'h:mm a')}
                    </p>
                  )}
                  {height > 56 && event.location && (
                    <p className="text-xs opacity-60 truncate mt-0.5">{event.location}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── List View ──────────────────────────────────────────────────────────────────

function ListViewComponent({
  currentDate,
  events,
  onEventClick,
}: {
  currentDate: Date;
  events: CalEvent[];
  onEventClick: (event: CalEvent) => void;
}) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );

  // Group by date
  const groups = new Map<string, CalEvent[]>();
  for (const e of sorted) {
    const key = format(new Date(e.startDateTime), 'yyyy-MM-dd');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  if (groups.size === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No events this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
      {Array.from(groups.entries()).map(([dateKey, dayEvents]) => {
        const day = new Date(dateKey + 'T00:00:00');
        const today = isToday(day);
        return (
          <div key={dateKey}>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shrink-0"
                style={{
                  background: today ? 'var(--cal-primary)' : 'rgba(255,255,255,0.07)',
                  color: today ? 'white' : 'rgba(255,255,255,0.6)',
                }}
              >
                {format(day, 'd')}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: today ? 'var(--cal-primary)' : 'rgba(255,255,255,0.8)' }}>
                  {today ? 'Today' : format(day, 'EEEE')}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {format(day, 'MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="ml-12 space-y-2">
              {dayEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="w-full text-left rounded-xl px-4 py-3 flex items-start gap-3 transition-all hover:brightness-110"
                  style={{ background: `${event.color}18`, border: `1px solid ${event.color}30` }}
                >
                  <div
                    className="h-3 w-3 rounded-full mt-1 shrink-0"
                    style={{ background: event.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{event.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {event.allDay
                        ? 'All day'
                        : `${format(new Date(event.startDateTime), 'h:mm a')} – ${format(new Date(event.endDateTime), 'h:mm a')}`}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Event Form Modal ───────────────────────────────────────────────────────────

function EventFormModal({
  open,
  onClose,
  event,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  event?: CalEvent;
  defaultDate?: Date;
}) {
  const { createEvent, updateEvent } = useCalendarStore();
  const isEdit = Boolean(event);

  const defaultStart = defaultDate
    ? format(defaultDate, "yyyy-MM-dd'T'09:00")
    : event
    ? toLocalDatetimeValue(event.startDateTime)
    : format(new Date(), "yyyy-MM-dd'T'09:00");

  const defaultEnd = defaultDate
    ? format(defaultDate, "yyyy-MM-dd'T'10:00")
    : event
    ? toLocalDatetimeValue(event.endDateTime)
    : format(new Date(), "yyyy-MM-dd'T'10:00");

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [startDateTime, setStartDateTime] = useState(defaultStart);
  const [endDateTime, setEndDateTime] = useState(defaultEnd);
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [color, setColor] = useState(event?.color ?? 'var(--cal-primary)');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when event changes
  useEffect(() => {
    setTitle(event?.title ?? '');
    setDescription(event?.description ?? '');
    setLocation(event?.location ?? '');
    setStartDateTime(
      event ? toLocalDatetimeValue(event.startDateTime)
        : defaultDate ? format(defaultDate, "yyyy-MM-dd'T'09:00")
        : format(new Date(), "yyyy-MM-dd'T'09:00")
    );
    setEndDateTime(
      event ? toLocalDatetimeValue(event.endDateTime)
        : defaultDate ? format(defaultDate, "yyyy-MM-dd'T'10:00")
        : format(new Date(), "yyyy-MM-dd'T'10:00")
    );
    setAllDay(event?.allDay ?? false);
    setColor(event?.color ?? 'var(--cal-primary)');
    setError('');
  }, [event, defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setIsLoading(true);
    setError('');
    try {
      const payload: CreateEventInput = {
        title: title.trim(),
        description: description || undefined,
        location: location || undefined,
        startDateTime: new Date(startDateTime).toISOString(),
        endDateTime: new Date(endDateTime).toISOString(),
        allDay,
        color,
      };
      if (isEdit && event) {
        await updateEvent(event.id, payload);
      } else {
        await createEvent(payload);
      }
      onClose();
    } catch {
      setError('Failed to save event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
  } as const;

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '4px',
    display: 'block',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: '#1A1D2E', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <h2 className="text-base font-semibold text-white">
                  {isEdit ? 'Edit Event' : 'New Event'}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Title */}
                <div>
                  <label style={labelStyle}>Title</label>
                  <input
                    style={inputStyle}
                    placeholder="Event title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Start / End */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Start</label>
                    <input
                      style={inputStyle}
                      type={allDay ? 'date' : 'datetime-local'}
                      value={allDay ? startDateTime.slice(0, 10) : startDateTime}
                      onChange={(e) =>
                        setStartDateTime(allDay ? `${e.target.value}T00:00` : e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>End</label>
                    <input
                      style={inputStyle}
                      type={allDay ? 'date' : 'datetime-local'}
                      value={allDay ? endDateTime.slice(0, 10) : endDateTime}
                      onChange={(e) =>
                        setEndDateTime(allDay ? `${e.target.value}T23:59` : e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* All day toggle */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setAllDay(!allDay)}
                    className="relative h-5 w-9 rounded-full transition-colors"
                    style={{ background: allDay ? 'var(--cal-primary)' : 'rgba(255,255,255,0.15)' }}
                  >
                    <div
                      className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                      style={{ left: allDay ? '18px' : '2px' }}
                    />
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>All day</span>
                </label>

                {/* Location */}
                <div>
                  <label style={labelStyle}>Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <input
                      style={{ ...inputStyle, paddingLeft: '32px' }}
                      placeholder="Add location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={labelStyle}>Notes</label>
                  <div className="relative">
                    <AlignLeft className="absolute left-3 top-2.5 h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <textarea
                      style={{ ...inputStyle, paddingLeft: '32px', resize: 'none' } as React.CSSProperties}
                      rows={3}
                      placeholder="Add notes"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <label style={labelStyle}>Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        title={opt.label}
                        onClick={() => setColor(opt.value)}
                        className="h-7 w-7 rounded-full transition-all hover:scale-110"
                        style={{
                          backgroundColor: opt.value,
                          outline: color === opt.value ? `2px solid white` : '2px solid transparent',
                          outlineOffset: '2px',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(224,36,36,0.1)', color: '#E02424' }}>
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
                    style={{ background: 'var(--cal-primary)' }}
                  >
                    {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {isEdit ? 'Save Changes' : 'Create Event'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 rounded-xl text-sm font-semibold transition-colors hover:bg-white/10"
                    style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Event Detail Modal ─────────────────────────────────────────────────────────

function EventDetailModal({
  event,
  onClose,
  onEdit,
}: {
  event: CalEvent | null;
  onClose: () => void;
  onEdit: (e: CalEvent) => void;
}) {
  const { deleteEvent } = useCalendarStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!event) return;
    setIsDeleting(true);
    try {
      await deleteEvent(event.id);
      onClose();
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {event && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: '#1A1D2E', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Color bar + header */}
              <div style={{ background: `${event.color}22`, borderBottom: `1px solid ${event.color}30` }}>
                <div className="flex items-start justify-between px-6 pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-1 h-3 w-3 rounded-full shrink-0"
                      style={{ background: event.color }}
                    />
                    <div>
                      <h3 className="text-base font-semibold text-white leading-snug">{event.title}</h3>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1.5 hover:bg-white/10 transition-colors shrink-0"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 space-y-3">
                {/* Time */}
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {event.allDay
                      ? format(new Date(event.startDateTime), 'EEEE, MMMM d, yyyy')
                      : `${format(new Date(event.startDateTime), 'EEEE, MMMM d · h:mm a')} – ${format(new Date(event.endDateTime), 'h:mm a')}`
                    }
                  </p>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{event.location}</p>
                  </div>
                )}

                {event.description && (
                  <div className="flex items-start gap-3">
                    <AlignLeft className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
                    <p className="text-sm whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.6)' }}>{event.description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 px-6 pb-5">
                <button
                  onClick={() => { onClose(); onEdit(event); }}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--cal-primary)' }}
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center justify-center gap-1.5 px-4 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 hover:bg-red-900/40"
                  style={{ color: '#E02424', border: '1px solid rgba(224,36,36,0.3)' }}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main EventManager Component ────────────────────────────────────────────────

export function EventManager() {
  const {
    events, isLoading,
    fetchMonthEvents, fetchWeekEvents, fetchDayEvents,
    fetchEvents,
  } = useCalendarStore();

  const [view, setView] = useState<CalView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [showNewEvent, setShowNewEvent] = useState(false);

  // Fetch events when view/date changes
  useEffect(() => {
    if (view === 'month') {
      fetchMonthEvents(currentDate);
    } else if (view === 'week') {
      fetchWeekEvents(currentDate);
    } else if (view === 'day') {
      fetchDayEvents(currentDate);
    } else {
      // List view: fetch the next 3 months
      const start = formatISO(startOfDay(currentDate));
      const end = formatISO(endOfMonth(addMonths(currentDate, 2)));
      fetchEvents(start, end);
    }
  }, [view, currentDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigation
  const navigate = (dir: 'prev' | 'next') => {
    const delta = dir === 'prev' ? -1 : 1;
    if (view === 'month' || view === 'list') {
      setCurrentDate(addMonths(currentDate, delta));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, delta));
    } else {
      setCurrentDate(addDays(currentDate, delta));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  // Title
  const getTitle = () => {
    if (view === 'month' || view === 'list') return format(currentDate, 'MMMM yyyy');
    if (view === 'week') {
      const ws = startOfWeek(currentDate);
      const we = endOfWeek(currentDate);
      return format(ws, 'MMM yyyy') === format(we, 'MMM yyyy')
        ? `${format(ws, 'MMM d')} – ${format(we, 'd, yyyy')}`
        : `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  };

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setView('day');
  };

  const handleAddClick = (day: Date) => {
    setCreateDate(day);
  };

  const handleSlotClick = (date: Date) => {
    setCreateDate(date);
  };

  const handleEventClick = (event: CalEvent) => {
    setSelectedEvent(event);
  };

  const viewButtons: { key: CalView; icon: React.ReactNode; label: string }[] = [
    { key: 'month', icon: <LayoutGrid className="h-3.5 w-3.5" />, label: 'Month' },
    { key: 'week', icon: <Calendar className="h-3.5 w-3.5" />, label: 'Week' },
    { key: 'day', icon: <Clock className="h-3.5 w-3.5" />, label: 'Day' },
    { key: 'list', icon: <List className="h-3.5 w-3.5" />, label: 'List' },
  ];

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#0D0F1A', color: 'white' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        {/* Left: title + today */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">{getTitle()}</h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Today
          </button>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div
            className="flex rounded-xl overflow-hidden p-0.5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {viewButtons.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: view === key ? 'var(--cal-primary)' : 'transparent',
                  color: view === key ? 'white' : 'rgba(255,255,255,0.45)',
                }}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Nav arrows */}
          <button
            onClick={() => navigate('prev')}
            className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate('next')}
            className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* New event */}
          <button
            onClick={() => setShowNewEvent(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--cal-primary)' }}
          >
            <Plus className="h-3.5 w-3.5" />
            New Event
          </button>
        </div>
      </div>

      {/* ── Loading bar ── */}
      {isLoading && (
        <div className="h-0.5 shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            className="h-full"
            style={{ background: 'var(--cal-primary)' }}
            initial={{ width: '0%' }}
            animate={{ width: '70%' }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* ── View body ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onDayClick={handleDayClick}
              onAddClick={handleAddClick}
              onEventClick={handleEventClick}
            />
          )}
          {view === 'week' && (
            <WeekViewComponent
              currentDate={currentDate}
              events={events}
              onSlotClick={handleSlotClick}
              onEventClick={handleEventClick}
            />
          )}
          {view === 'day' && (
            <DayViewComponent
              currentDate={currentDate}
              events={events}
              onSlotClick={handleSlotClick}
              onEventClick={handleEventClick}
            />
          )}
          {view === 'list' && (
            <ListViewComponent
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Modals ── */}
      <EventFormModal
        open={Boolean(createDate)}
        onClose={() => setCreateDate(null)}
        defaultDate={createDate ?? undefined}
      />
      <EventFormModal
        open={showNewEvent}
        onClose={() => setShowNewEvent(false)}
      />
      <EventFormModal
        open={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        event={editingEvent ?? undefined}
      />
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={(e) => { setSelectedEvent(null); setEditingEvent(e); }}
      />
    </div>
  );
}
