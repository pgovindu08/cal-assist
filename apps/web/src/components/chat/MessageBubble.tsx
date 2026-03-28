import { cn, formatTime } from '@/lib/utils';
import { EventConfirmCard } from './EventConfirmCard';
import type { ChatMessage } from '@/store/chatStore';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'USER';

  return (
    <div
      className={cn(
        'flex items-start gap-3 animate-slide-in',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
          CA
        </div>
      )}

      <div className={cn('flex flex-col max-w-[75%]', isUser && 'items-end')}>
        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm bg-secondary text-foreground'
          )}
        >
          {message.content}
        </div>

        {/* Event confirmation card */}
        {!isUser && message.requiresConfirmation && message.actionPayload && (
          <EventConfirmCard
            messageId={message.id}
            payload={message.actionPayload as {
              title: string;
              description?: string;
              location?: string;
              startDateTime: string;
              endDateTime: string;
              allDay: boolean;
            }}
          />
        )}

        {/* Timestamp */}
        <time className="mt-1 text-[10px] text-muted-foreground">
          {formatTime(message.createdAt)}
        </time>
      </div>
    </div>
  );
}
