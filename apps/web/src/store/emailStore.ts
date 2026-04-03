import { create } from 'zustand';
import { api } from '@/lib/api';

export type EmailCategory = 'Urgent' | 'Needs Reply' | 'Informational' | 'Newsletter' | 'Promotion';

export interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  hasAttachment: boolean;
  // populated after summarize
  summary?: string;
  category?: EmailCategory;
  isImportant?: boolean;
  importantReason?: string | null;
}

interface EmailState {
  emails: Email[];
  isFetching: boolean;
  isSummarizing: boolean;
  summarized: boolean;
  error: string | null;

  fetchInbox: () => Promise<void>;
  summarizeAll: () => Promise<void>;
  removeEmail: (id: string) => void;   // optimistic removal from local state
  restoreEmail: (email: Email) => void; // undo — put back in local state
  clearError: () => void;
}

export const useEmailStore = create<EmailState>((set, get) => ({
  emails: [],
  isFetching: false,
  isSummarizing: false,
  summarized: false,
  error: null,

  fetchInbox: async () => {
    set({ isFetching: true, error: null, summarized: false });
    try {
      const { data } = await api.get('/email/inbox');
      set({ emails: data.data.emails, isFetching: false });
    } catch {
      set({ error: 'Failed to load inbox', isFetching: false });
    }
  },

  summarizeAll: async () => {
    set({ isSummarizing: true, error: null });
    try {
      const { data } = await api.post('/email/summarize');
      set({ emails: data.data.emails, isSummarizing: false, summarized: true });
    } catch {
      set({ error: 'Failed to summarize emails', isSummarizing: false });
    }
  },

  removeEmail: (id) =>
    set((state) => ({ emails: state.emails.filter((e) => e.id !== id) })),

  restoreEmail: (email) =>
    set((state) => {
      // Insert back in roughly the same position (prepend for simplicity)
      if (state.emails.find((e) => e.id === email.id)) return state;
      return { emails: [email, ...state.emails] };
    }),

  clearError: () => set({ error: null }),
}));
