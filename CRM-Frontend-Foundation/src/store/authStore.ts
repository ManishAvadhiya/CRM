import { create } from 'zustand';
import type { LoginResponse } from '@/types';

interface AuthState {
  user: LoginResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: LoginResponse) => void;
  login: (user: LoginResponse) => void;
  logout: () => void;
}

const ACCESS_COOKIE = 'crm_access_token';
const USER_COOKIE = 'crm_user';

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const cookies = document.cookie.split(';').map((part) => part.trim());
  const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!target) return null;
  return decodeURIComponent(target.slice(name.length + 1));
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function getInitialAuth() {
  const token = getCookie(ACCESS_COOKIE);
  const rawUser = getCookie(USER_COOKIE);

  if (!token || !rawUser) {
    return { token: null, user: null as LoginResponse | null, isAuthenticated: false };
  }

  try {
    const user = JSON.parse(rawUser) as LoginResponse;
    return { token, user, isAuthenticated: true };
  } catch {
    return { token: null, user: null as LoginResponse | null, isAuthenticated: false };
  }
}

const initial = getInitialAuth();

export const useAuthStore = create<AuthState>()((set) => ({
  user: initial.user,
  token: initial.token,
  isAuthenticated: initial.isAuthenticated,
  setAuth: (user) => {
    setCookie(ACCESS_COOKIE, user.token, 7);
    setCookie(USER_COOKIE, JSON.stringify(user), 7);
    set({ user, token: user.token, isAuthenticated: true });
  },
  login: (user) => {
    setCookie(ACCESS_COOKIE, user.token, 7);
    setCookie(USER_COOKIE, JSON.stringify(user), 7);
    set({ user, token: user.token, isAuthenticated: true });
  },
  logout: () => {
    deleteCookie(ACCESS_COOKIE);
    deleteCookie(USER_COOKIE);
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
