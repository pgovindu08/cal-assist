'use client';

import { CalendarPlus, X, Check, MapPin, Clock } from 'lucide-react';
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
}

interface EventConfirmCardProps {
  messageId: string;
  payload: EventPayload;
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
