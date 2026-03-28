'use client';

import { useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChatStore } from '@/store/chatStore';

export function ChatContainer() {
  const { fetchHistory } = useChatStore();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="flex h-full flex-col">
      <MessageList />
      <ChatInput />
    </div>
  );
}
