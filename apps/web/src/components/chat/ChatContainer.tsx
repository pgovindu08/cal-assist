'use client';

import { useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChatStore } from '@/store/chatStore';

export function ChatContainer() {
  const { fetchHistory, messages } = useChatStore();
  const isEmpty = messages.length === 0;

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="flex h-full flex-col">
      {/* Only render message list once there are messages */}
      {!isEmpty && <MessageList />}

      {/* ChatInput handles both empty (full-screen) and compact (bottom bar) states */}
      <ChatInput />
    </div>
  );
}
