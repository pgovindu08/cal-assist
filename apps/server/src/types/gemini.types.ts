export type GeminiIntent =
  | 'CREATE_EVENT'
  | 'LIST_EVENTS'
  | 'UPDATE_EVENT'
  | 'DELETE_EVENT'
  | 'GENERAL_QUESTION'
  | 'NONE';

export interface GeminiEventPayload {
  title: string;
  description?: string | null;
  location?: string | null;
  startDateTime: string;  // ISO 8601
  endDateTime: string;    // ISO 8601
  attendees?: string[] | null;
  allDay: boolean;
  recurrence?: string | null; // RRULE string
}

export interface GeminiQueryRange {
  start: string; // ISO 8601
  end: string;   // ISO 8601
}

export interface GeminiResponse {
  intent: GeminiIntent;
  reply: string;
  confidence: number;
  event?: GeminiEventPayload | null;
  queryRange?: GeminiQueryRange | null;
  needsClarification: boolean;
  clarificationQuestion?: string | null;
  targetEventId?: string | null; // for UPDATE/DELETE
}
