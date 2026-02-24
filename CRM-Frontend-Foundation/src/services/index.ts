import { apiClient } from '@/lib/api-client';
import type {
  ApiResponse,
  Customer,
  ProductVariant,
  Order,
  Subscription,
  Notification,
  DashboardStats,
  Activity,
} from '@/types';

// Customers API
export const customersApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Customer[]>>('/customers');
    return data.data;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
    return data.data;
  },

  create: async (customer: Partial<Customer>) => {
    const { data } = await apiClient.post<ApiResponse<Customer>>('/customers', customer);
    return data.data;
  },

  update: async (id: number, customer: Partial<Customer>) => {
    const { data } = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, customer);
    return data.data;
  },

  delete: async (id: number) => {
    const { data } = await apiClient.delete<ApiResponse<boolean>>(`/customers/${id}`);
    return data.data;
  },
};

// Product Variants API
export const productVariantsApi = {
  getAll: async (activeOnly = true) => {
    const { data } = await apiClient.get<ApiResponse<ProductVariant[]>>(
      '/productvariants',
      { params: { activeOnly } }
    );
    return data.data;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<ProductVariant>>(
      `/productvariants/${id}`
    );
    return data.data;
  },
};

// Orders API
export const ordersApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Order[]>>('/orders');
    return data.data;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return data.data;
  },

  create: async (order: Partial<Order>) => {
    const { data } = await apiClient.post<ApiResponse<Order>>('/orders', order);
    return data.data;
  },

  confirm: async (id: number) => {
    const { data } = await apiClient.put<ApiResponse<Subscription>>(
      `/orders/${id}/confirm`
    );
    return data.data;
  },
};

// Subscriptions API
export const subscriptionsApi = {
  getAll: async (status?: string) => {
    const { data } = await apiClient.get<ApiResponse<Subscription[]>>(
      '/subscriptions',
      { params: { status } }
    );
    return data.data;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<Subscription>>(
      `/subscriptions/${id}`
    );
    return data.data;
  },

  getUpcomingRenewals: async (days = 30) => {
    const { data } = await apiClient.get<ApiResponse<Subscription[]>>(
      '/subscriptions/upcoming-renewals',
      { params: { days } }
    );
    return data.data;
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async (unreadOnly = false) => {
    const { data } = await apiClient.get<ApiResponse<Notification[]>>(
      '/notifications',
      { params: { unreadOnly } }
    );
    return data.data;
  },

  markAsRead: async (id: number) => {
    const { data } = await apiClient.put<ApiResponse<boolean>>(
      `/notifications/${id}/mark-read`
    );
    return data.data;
  },

  markAllAsRead: async () => {
    const { data } = await apiClient.put<ApiResponse<boolean>>(
      '/notifications/mark-all-read'
    );
    return data.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const { data } = await apiClient.get<ApiResponse<DashboardStats>>(
      '/dashboard/stats'
    );
    return data.data;
  },

  getRecentActivities: async (count = 10) => {
    const { data } = await apiClient.get<ApiResponse<Activity[]>>(
      '/dashboard/recent-activities',
      { params: { count } }
    );
    return data.data;
  },
};
