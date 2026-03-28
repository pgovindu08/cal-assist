export interface CalendarEvent {
  id: string;
  googleEventId: string;
  title: string;
  description: string | null;
  location: string | null;
  startDateTime: string; // ISO 8601
  endDateTime: string;   // ISO 8601
  allDay: boolean;
  recurrence: string | null; // RRULE string
  calendarId: string;
  htmlLink: string | null;
}

export interface EventPayload {
  title: string;
  description?: string;
  location?: string;
  startDateTime: string; // ISO 8601
  endDateTime: string;   // ISO 8601
  attendees?: string[];
  allDay: boolean;
  recurrence?: string | null;
}

export interface ListEventsQuery {
  start: string; // ISO 8601
  end: string;   // ISO 8601
}
