import { apiClient } from '@/lib/api-client';
import type {
  ApiResponse,
  Customer,
  ProductVariant,
  Order,
  Subscription,
  SubscriptionHistory,
  CancelSubscriptionRequest,
  SuspendSubscriptionRequest,
  Notification,
  DashboardStats,
  Activity,
  ActivityListItem,
  CreateActivityRequest,
  UpdateActivityRequest,
  User,
  PartnerEarning,
  AdvancedDashboardStats,
  RevenueAnalytics,
  CustomerAnalytics,
  SalesPipeline,
  ProductAnalytics,
  PartnerPerformance,
  SubscriptionAnalytics,
  ActivityAnalytics,
  GeographicAnalytics,
  TimeBasedAnalytics,
  FinancialHealth,
  DashboardAlerts,
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

  getEarnings: async () => {
    const { data } = await apiClient.get<ApiResponse<PartnerEarning[]>>('/orders/earnings');
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

  cancel: async (id: number) => {
    const { data } = await apiClient.put<ApiResponse<Order>>(
      `/orders/${id}/cancel`
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

  getRenewable: async () => {
    const { data } = await apiClient.get<ApiResponse<Subscription[]>>(
      '/subscriptions/renewable'
    );
    return data.data;
  },

  getHistory: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<SubscriptionHistory[]>>(
      `/subscriptions/${id}/history`
    );
    return data.data;
  },

  cancel: async (id: number, request: CancelSubscriptionRequest) => {
    const { data } = await apiClient.put<ApiResponse<Subscription>>(
      `/subscriptions/${id}/cancel`,
      request
    );
    return data.data;
  },

  suspend: async (id: number, request: SuspendSubscriptionRequest) => {
    const { data } = await apiClient.put<ApiResponse<Subscription>>(
      `/subscriptions/${id}/suspend`,
      request
    );
    return data.data;
  },

  reactivate: async (id: number) => {
    const { data } = await apiClient.put<ApiResponse<Subscription>>(
      `/subscriptions/${id}/reactivate`
    );
    return data.data;
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async (unreadOnly = true) => {
    const { data } = await apiClient.get<ApiResponse<Notification[]>>(
      '/notifications',
      { params: { unreadOnly } }
    );
    return data.data;
  },

  getCount: async () => {
    const { data } = await apiClient.get<ApiResponse<number>>(
      '/notifications/count'
    );
    return data.data;
  },

  markAsRead: async (id: number) => {
    const { data } = await apiClient.post<ApiResponse<boolean>>(
      `/notifications/${id}/read`
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

  getAdvancedStats: async () => {
    const { data } = await apiClient.get<ApiResponse<AdvancedDashboardStats>>(
      '/dashboard/advanced-stats'
    );
    return data.data;
  },

  getRevenueAnalytics: async () => {
    const { data } = await apiClient.get<ApiResponse<RevenueAnalytics>>(
      '/dashboard/revenue-analytics'
    );
    return data.data;
  },

  getCustomerAnalytics: async () => {
    const { data } = await apiClient.get<ApiResponse<CustomerAnalytics>>(
      '/dashboard/customer-analytics'
    );
    return data.data;
  },

  getSalesPipeline: async () => {
    const { data } = await apiClient.get<ApiResponse<SalesPipeline>>(
      '/dashboard/sales-pipeline'
    );
    return data.data;
  },

  getProductAnalytics: async () => {
    const { data } = await apiClient.get<ApiResponse<ProductAnalytics>>(
      '/dashboard/product-analytics'
    );
    return data.data;
  },

  getPartnerPerformance: async () => {
    const { data } = await apiClient.get<ApiResponse<PartnerPerformance>>(
      '/dashboard/partner-performance'
    );
    return data.data;
  },

  getSubscriptionAnalytics: async () => {
    const { data } = await apiClient.get<ApiResponse<SubscriptionAnalytics>>(
      '/dashboard/subscription-analytics'
    );
    return data.data;
  },

  getActivityAnalytics: async () => {
    const { data } = await apiClient.get<ApiResponse<ActivityAnalytics>>(
      '/dashboard/activity-analytics'
    );
    return data.data;
  },

  getGeographicAnalytics: async () => {
    const { data } = await apiClient.get<ApiResponse<GeographicAnalytics>>(
      '/dashboard/geographic-analytics'
    );
    return data.data;
  },

  getTimeBasedAnalytics: async () => {
    const { data } = await apiClient.get<ApiResponse<TimeBasedAnalytics>>(
      '/dashboard/time-based-analytics'
    );
    return data.data;
  },

  getFinancialHealth: async () => {
    const { data } = await apiClient.get<ApiResponse<FinancialHealth>>(
      '/dashboard/financial-health'
    );
    return data.data;
  },

  getAlerts: async () => {
    const { data } = await apiClient.get<ApiResponse<DashboardAlerts>>(
      '/dashboard/alerts'
    );
    return data.data;
  },
};

// Export API
export const exportApi = {
  downloadPartnerProfile: async (preset: 'generic' | 'zoho' | 'hubspot' | 'salesforce' = 'generic') => {
    const response = await apiClient.get('/export/partner-profile', {
      params: { preset },
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'] as string | undefined;
    const fileNameMatch = contentDisposition?.match(/filename="?([^\";]+)"?/i);
    const fileName = fileNameMatch?.[1] || `crm_partner_export_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;

    return {
      blob: response.data as Blob,
      fileName,
    };
  },
};

// Users API
export const usersApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<User[]>>('/users');
    // console.log(data.data);
    return data.data;
  },

  getMyPartners: async () => {
    const { data } = await apiClient.get<ApiResponse<User[]>>('/users/my-partners');
    return data.data;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return data.data;
  },

  getCurrentProfile: async () => {
    const { data } = await apiClient.get<ApiResponse<User>>('/users/profile');
    return data.data;
  },

  createMarketing: async (userData: { name: string; email: string; phone?: string; password: string }) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      '/users/create-marketing',
      userData
    );
    return data.data;
  },

  createPartner: async (partnerData: { name: string; email: string; phone?: string; password: string }) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      '/users/create-partner',
      partnerData
    );
    return data.data;
  },

  update: async (id: number, userData: { name: string; email: string; phone?: string }) => {
    const { data } = await apiClient.put<ApiResponse<User>>(
      `/users/${id}`,
      userData
    );
    return data.data;
  },

  delete: async (id: number) => {
    const { data } = await apiClient.delete<ApiResponse<string>>(
      `/users/${id}`
    );
    return data.data;
  },

  disable: async (id: number) => {
    const { data } = await apiClient.put<ApiResponse<string>>(
      `/users/${id}/disable`,
      {}
    );
    return data.data;
  },

  enable: async (id: number) => {
    const { data } = await apiClient.put<ApiResponse<string>>(
      `/users/${id}/enable`,
      {}
    );
    return data.data;
  },
};

// Activities API
export const activitiesApi = {
  getAll: async (params?: {
    relatedToType?: string;
    relatedToId?: number;
    type?: string;
  }) => {
    const { data } = await apiClient.get<ApiResponse<ActivityListItem[]>>('/activities', {
      params,
    });
    return data.data;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<Activity>>(`/activities/${id}`);
    return data.data;
  },

  create: async (payload: CreateActivityRequest) => {
    const { data } = await apiClient.post<ApiResponse<Activity>>('/activities', payload);
    return data.data;
  },

  update: async (id: number, payload: UpdateActivityRequest) => {
    const { data } = await apiClient.put<ApiResponse<Activity>>(`/activities/${id}`, payload);
    return data.data;
  },

  delete: async (id: number) => {
    const { data } = await apiClient.delete<ApiResponse<boolean>>(`/activities/${id}`);
    return data.data;
  },
};
