import { apiClient } from '@/lib/api-client';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
  UserProfile,
  ChangePasswordRequest,
} from '@/types';

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

  forgotPassword: async (request: ForgotPasswordRequest) => {
    const { data } = await apiClient.post<ApiResponse<{ email: string; message: string }>>(
      '/auth/forgot-password',
      request
    );
    return data.data;
  },

  verifyOtp: async (request: VerifyOtpRequest) => {
    const { data } = await apiClient.post<ApiResponse<{ isValid: boolean; message: string }>>(
      '/auth/verify-otp',
      request
    );
    return data.data;
  },

  resetPassword: async (request: ResetPasswordRequest) => {
    const { data } = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
      '/auth/reset-password',
      request
    );
    return data.data;
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get<ApiResponse<UserProfile>>('/users/me');
    return data.data;
  },

  changePassword: async (request: ChangePasswordRequest) => {
    const { data } = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
      '/users/change-password',
      request
    );
    return data.data;
  },
};

export const authService = authApi;
