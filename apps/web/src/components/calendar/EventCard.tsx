import { formatTime } from '@/lib/utils';
import type { CalEvent } from '@/store/calendarStore';

interface EventCardProps {
  event: CalEvent;
  compact?: boolean;
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const color = event.color ?? '#1A56DB';

  if (compact) {
    return (
      <div
        className="truncate rounded px-1.5 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity text-white"
        style={{ backgroundColor: color }}
        title={event.title}
      >
        {!event.allDay && (
          <span className="mr-1 opacity-80">{formatTime(event.startDateTime)}</span>
        )}
        {event.title}
      </div>
    );
  }

  return (
    <div
      className="rounded-lg px-3 py-2.5 cursor-pointer hover:opacity-90 transition-opacity text-white"
      style={{ backgroundColor: color }}
    >
      <p className="font-medium text-sm truncate">{event.title}</p>
      <p className="text-xs opacity-80 mt-0.5">
        {event.allDay
          ? 'All day'
          : `${formatTime(event.startDateTime)} – ${formatTime(event.endDateTime)}`}
      </p>
      {event.location && (
        <p className="text-xs opacity-70 truncate">{event.location}</p>
      )}
    </div>
  );
}
