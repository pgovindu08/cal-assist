export interface CalendarEvent {
  id: string;
  googleEventId: string;
  title: string;
  description: string | null;
  location: string | null;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean;
  recurrence: string | null;
  calendarId: string;
  htmlLink: string | null;
}

export interface EventPayload {
  title: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  attendees?: string[];
  allDay: boolean;
  recurrence?: string | null;
}
