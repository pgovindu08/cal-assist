'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Trash2, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCalendarStore, type CalEvent } from '@/store/calendarStore';

// ─── Create/Edit Modal ────────────────────────────────────────────────────────

interface EventFormProps {
  open: boolean;
  onClose: () => void;
  event?: CalEvent;           // if provided → edit mode
  defaultDate?: Date;         // pre-fill date when creating from a cell click
}

const COLOR_OPTIONS = [
  { label: 'Blue',   value: '#1A56DB' },
  { label: 'Green',  value: '#057A55' },
  { label: 'Red',    value: '#E02424' },
  { label: 'Purple', value: '#7E3AF2' },
  { label: 'Orange', value: '#D03801' },
  { label: 'Pink',   value: '#E74694' },
];

export function EventFormModal({ open, onClose, event, defaultDate }: EventFormProps) {
  const { createEvent, updateEvent } = useCalendarStore();
  const isEdit = Boolean(event);

  const toLocalDatetimeValue = (iso: string) =>
    format(new Date(iso), "yyyy-MM-dd'T'HH:mm");

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
  const [color, setColor] = useState(event?.color ?? '#1A56DB');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }

    setIsLoading(true);
    setError('');

    try {
      const payload = {
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit event' : 'New event'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title *</label>
            <Input
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Start</label>
              <Input
                type={allDay ? 'date' : 'datetime-local'}
                value={allDay ? startDateTime.slice(0, 10) : startDateTime}
                onChange={(e) => setStartDateTime(allDay ? `${e.target.value}T00:00` : e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">End</label>
              <Input
                type={allDay ? 'date' : 'datetime-local'}
                value={allDay ? endDateTime.slice(0, 10) : endDateTime}
                onChange={(e) => setEndDateTime(allDay ? `${e.target.value}T23:59` : e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="rounded border-input"
            />
            All day
          </label>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Location</label>
            <Input
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={3}
              placeholder="Add description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  onClick={() => setColor(opt.value)}
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: opt.value,
                    borderColor: color === opt.value ? 'hsl(var(--foreground))' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create event'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Event Detail/Delete Modal ────────────────────────────────────────────────

interface EventDetailProps {
  event: CalEvent | null;
  onClose: () => void;
  onEdit: (event: CalEvent) => void;
}

export function EventDetailModal({ event, onClose, onEdit }: EventDetailProps) {
  const { deleteEvent } = useCalendarStore();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!event) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEvent(event.id);
      onClose();
    } catch {
      setIsDeleting(false);
    }
  };

  const formatEventTime = () => {
    if (event.allDay) {
      return format(new Date(event.startDateTime), 'EEEE, MMMM d, yyyy');
    }
    const start = format(new Date(event.startDateTime), 'EEEE, MMMM d · h:mm a');
    const end = format(new Date(event.endDateTime), 'h:mm a');
    return `${start} – ${end}`;
  };

  return (
    <Dialog open={Boolean(event)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-4">
            <div
              className="mt-0.5 h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: event.color }}
            />
            <DialogTitle className="text-left leading-snug">{event.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">{formatEventTime()}</p>

          {event.location && (
            <p className="text-foreground">
              <span className="text-muted-foreground">Location: </span>
              {event.location}
            </p>
          )}

          {event.description && (
            <p className="whitespace-pre-wrap text-foreground">{event.description}</p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <Button
            className="flex-1"
            onClick={() => { onClose(); onEdit(event); }}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
