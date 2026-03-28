import type { Metadata } from 'next';
import { ChatContainer } from '@/components/chat/ChatContainer';

export const metadata: Metadata = {
  title: 'Chat — CalAssist',
};

export default function ChatPage() {
  return <ChatContainer />;
}
