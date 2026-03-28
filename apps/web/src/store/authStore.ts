import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  fetchMe: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) => {
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      // First try to refresh the token (uses httpOnly cookie)
      const { data: refreshData } = await api.post('/auth/refresh');
      const { accessToken, user } = refreshData.data;
      set({ user, accessToken, isAuthenticated: true, isLoading: false });
      return true;
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  },
}));
