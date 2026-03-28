import { create } from 'zustand';
import { api } from '@/lib/api';
import { getUserTimezone } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  actionType: string | null;
  actionPayload: Record<string, unknown> | null;
  googleEventId: string | null;
  events?: unknown[];
  requiresConfirmation?: boolean;
  createdAt: string;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  addMessage: (msg: ChatMessage) => void;
  sendMessage: (content: string) => Promise<void>;
  confirmEvent: (messageId: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
  loadMore: () => Promise<void>;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  hasMore: false,

  addMessage: (msg) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  sendMessage: async (content) => {
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content,
      actionType: null,
      actionPayload: null,
      googleEventId: null,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const { data } = await api.post('/chat/message', {
        content,
        timezone: getUserTimezone(),
      });

      set((state) => ({
        messages: [...state.messages, data.data.message],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const errorText = error.response?.data?.error?.message || 'Something went wrong. Please try again.';
      // Show the error as an assistant message so the user sees it
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'ASSISTANT',
        content: `⚠️ ${errorText}`,
        actionType: null,
        actionPayload: null,
        googleEventId: null,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
        error: errorText,
      }));
    }
  },

  confirmEvent: async (messageId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post(`/chat/confirm/${messageId}`);
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, requiresConfirmation: false } : m
        ),
        isLoading: false,
      }));
      // Add a new assistant confirmation message
      set((state) => ({
        messages: [...state.messages, data.data.message],
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/chat/history?limit=50');
      set({
        messages: data.data.messages,
        hasMore: data.data.hasMore,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  loadMore: async () => {
    const { messages } = get();
    if (!messages.length) return;
    const firstId = messages[0]?.id;
    try {
      const { data } = await api.get(`/chat/history?limit=50&before=${firstId}`);
      set((state) => ({
        messages: [...data.data.messages, ...state.messages],
        hasMore: data.data.hasMore,
      }));
    } catch {
      // Ignore
    }
  },

  clearError: () => set({ error: null }),
}));
