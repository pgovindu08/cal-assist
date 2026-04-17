'use client';

import { CalendarPlus, X, Check, MapPin, Clock, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { useChatStore } from '@/store/chatStore';

interface EventPayload {
  title: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean;
  recurrence?: string | null;
}

interface EventConfirmCardProps {
  messageId: string;
  payload: EventPayload;
}

const DAY_MAP: Record<string, string> = {
  MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun',
};

function humanizeRrule(rrule: string): string {
  const rule = rrule.replace(/^RRULE:/i, '');
  const parts: Record<string, string> = {};
  rule.split(';').forEach((part) => {
    const [key, val] = part.split('=');
    if (key && val) parts[key] = val;
  });

  const freq = parts['FREQ'];
  const interval = parts['INTERVAL'] ? parseInt(parts['INTERVAL'], 10) : 1;
  const byday = parts['BYDAY'];
  const bymonthday = parts['BYMONTHDAY'];
  const count = parts['COUNT'];
  const until = parts['UNTIL'];

  let base = '';
  if (freq === 'DAILY') {
    base = interval === 1 ? 'Every day' : `Every ${interval} days`;
  } else if (freq === 'WEEKLY') {
    if (byday) {
      const allWeekdays = ['MO', 'TU', 'WE', 'TH', 'FR'];
      const days = byday.split(',');
      const isWeekdays = allWeekdays.every((d) => days.includes(d)) && days.length === 5;
      if (isWeekdays) {
        base = 'Every weekday (Mon–Fri)';
      } else {
        const dayNames = days.map((d) => DAY_MAP[d] ?? d).join(', ');
        base = interval === 1 ? `Every ${dayNames}` : `Every ${interval} weeks on ${dayNames}`;
      }
    } else {
      base = interval === 1 ? 'Every week' : `Every ${interval} weeks`;
    }
  } else if (freq === 'MONTHLY') {
    if (bymonthday) {
      base = interval === 1
        ? `Every month on the ${bymonthday}${ordinal(parseInt(bymonthday, 10))}`
        : `Every ${interval} months on the ${bymonthday}${ordinal(parseInt(bymonthday, 10))}`;
    } else {
      base = interval === 1 ? 'Every month' : `Every ${interval} months`;
    }
  } else if (freq === 'YEARLY') {
    base = interval === 1 ? 'Every year' : `Every ${interval} years`;
  } else {
    return rrule;
  }

  if (count) base += `, ${count} times`;
  else if (until) {
    const d = until.replace(/T.*$/, '');
    const parsed = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    base += ` until ${new Date(parsed).toLocaleDateString()}`;
  }

  return base;
}

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export function EventConfirmCard({ messageId, payload }: EventConfirmCardProps) {
  const { confirmEvent, isLoading } = useChatStore();

  return (
    <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-4 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <CalendarPlus className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{payload.title}</p>
          <div className="mt-1 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              <span>
                {payload.allDay
                  ? new Date(payload.startDateTime).toLocaleDateString()
                  : formatDateTime(payload.startDateTime)}
              </span>
            </div>
            {payload.recurrence && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Repeat className="h-3 w-3 shrink-0" />
                <span>{humanizeRrule(payload.recurrence)}</span>
              </div>
            )}
            {payload.location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{payload.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          className="h-8 text-xs flex-1"
          onClick={() => confirmEvent(messageId)}
          disabled={isLoading}
        >
          <Check className="mr-1.5 h-3 w-3" />
          Confirm & Add
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" disabled={isLoading}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
