import type { EventPayload, CalendarEvent } from './calendar.types';

export type MessageRole = 'USER' | 'ASSISTANT';

export type CalendarAction =
  | 'CREATE_EVENT'
  | 'LIST_EVENTS'
  | 'UPDATE_EVENT'
  | 'DELETE_EVENT'
  | 'NONE';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  actionType: CalendarAction | null;
  actionPayload: EventPayload | null;
  googleEventId: string | null;
  events?: CalendarEvent[]; // populated for LIST_EVENTS responses
  requiresConfirmation?: boolean; // true when confidence < threshold
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
  timezone: string;
}

export interface SendMessageResponse {
  message: Message;
}

export interface ChatHistoryResponse {
  messages: Message[];
  hasMore: boolean;
}
