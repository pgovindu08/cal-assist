'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useChatStore } from '@/store/chatStore';

const WELCOME_PROMPTS = [
  "Schedule a dentist appointment next Thursday at 2pm",
  "What do I have on my calendar this week?",
  "Set up a team standup every Monday at 9am",
];

export function MessageList() {
  const { messages, isLoading } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="flex flex-col gap-4 py-6">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center gap-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <span className="text-2xl font-bold text-primary">CA</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Welcome to CalAssist</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your AI calendar assistant. Just talk.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Try saying...
              </p>
              {WELCOME_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-left hover:bg-secondary transition-colors"
                  onClick={() => {
                    const { sendMessage } = useChatStore.getState();
                    sendMessage(prompt);
                  }}
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
