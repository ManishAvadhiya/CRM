import { apiClient } from '@/lib/api-client';
import type { ApiResponse, LoginRequest, LoginResponse } from '@/types';

export const authApi = {
  login: async (credentials: LoginRequest) => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials
    );
    return data.data;
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/register',
      userData
    );
    return data.data;
  },
};
