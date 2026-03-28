import { create } from 'zustand';
import { api } from '@/lib/api';
import { startOfMonth, endOfMonth, formatISO } from 'date-fns';

export interface CalEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean;
  color: string;
  recurrence: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  allDay?: boolean;
  color?: string;
}

interface CalendarState {
  events: CalEvent[];
  selectedMonth: Date;
  isLoading: boolean;
  setSelectedMonth: (date: Date) => void;
  fetchEvents: (start: string, end: string) => Promise<void>;
  fetchMonthEvents: (month: Date) => Promise<void>;
  createEvent: (input: CreateEventInput) => Promise<CalEvent>;
  updateEvent: (id: string, input: Partial<CreateEventInput>) => Promise<CalEvent>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  selectedMonth: new Date(),
  isLoading: false,

  setSelectedMonth: (date) => set({ selectedMonth: date }),

  fetchEvents: async (start, end) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/events', { params: { start, end } });
      set({ events: data.data.events, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchMonthEvents: async (month) => {
    const start = formatISO(startOfMonth(month));
    const end = formatISO(endOfMonth(month));
    await get().fetchEvents(start, end);
  },

  createEvent: async (input) => {
    const { data } = await api.post('/events', input);
    const newEvent: CalEvent = data.data.event;
    set((state) => ({ events: [...state.events, newEvent].sort(
      (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    )}));
    return newEvent;
  },

  updateEvent: async (id, input) => {
    const { data } = await api.patch(`/events/${id}`, input);
    const updated: CalEvent = data.data.event;
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? updated : e)),
    }));
    return updated;
  },

  deleteEvent: async (id) => {
    await api.delete(`/events/${id}`);
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
  },
}));
