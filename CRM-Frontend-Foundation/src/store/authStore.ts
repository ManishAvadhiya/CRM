import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoginResponse } from '@/types';

interface AuthState {
  user: LoginResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: LoginResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user) => {
        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token: user.token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
