import { apiClient } from '@/lib/api-client';
import type { ApiResponse, Lead, Customer } from '@/types';

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

  create: async (lead: Partial<Lead>) => {
    const { data } = await apiClient.post<ApiResponse<Lead>>('/leads', lead);
    return data.data;
  },

  update: async (id: number, lead: Partial<Lead>) => {
    const { data} = await apiClient.put<ApiResponse<Lead>>(`/leads/${id}`, lead);
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
};
