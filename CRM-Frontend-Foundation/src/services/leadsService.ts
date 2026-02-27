import { apiClient } from '@/lib/api-client';
import type { ApiResponse, Lead, Customer, LeadDetailResponse, LeadHistory } from '@/types';

export const leadsApi = {
  getAll: async (status?: string) => {
    const { data } = await apiClient.get<ApiResponse<Lead[]>>('/leads', {
      params: { status },
    });
    return data.data;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<Lead>>(`/leads/${id}`);
    return data.data;
  },

  getWithHistory: async (id: number): Promise<LeadDetailResponse> => {
    const { data } = await apiClient.get<ApiResponse<LeadDetailResponse>>(
      `/leads/${id}/with-history`
    );
    return data.data;
  },

  create: async (lead: Partial<Lead>) => {
    const { data } = await apiClient.post<ApiResponse<Lead>>('/leads', lead);
    return data.data;
  },

  update: async (id: number, lead: Partial<Lead>) => {
    const { data } = await apiClient.put<ApiResponse<Lead>>(`/leads/${id}`, lead);
    return data.data;
  },

  delete: async (id: number) => {
    const { data } = await apiClient.delete<ApiResponse<boolean>>(`/leads/${id}`);
    return data.data;
  },

  convert: async (id: number) => {
    const { data } = await apiClient.post<ApiResponse<Customer>>(
      `/leads/${id}/convert`
    );
    return data.data;
  },

  addNote: async (id: number, note: string) => {
    const { data } = await apiClient.post<ApiResponse<LeadHistory>>(
      `/leads/${id}/add-note`,
      { Note: note }
    );
    return data.data;
  },

  updateStatus: async (id: number, requestData: { status: string; notes?: string }) => {
    const { data } = await apiClient.put<ApiResponse<LeadHistory>>(
      `/leads/${id}/update-status`,
      { Status: requestData.status, Notes: requestData.notes }
    );
    return data.data;
  },

  getHistory: async (id: number): Promise<LeadHistory[]> => {
    const { data } = await apiClient.get<ApiResponse<LeadHistory[]>>(
      `/leads/${id}/history`
    );
    return data.data;
  },
};

export const leadsService = leadsApi;
