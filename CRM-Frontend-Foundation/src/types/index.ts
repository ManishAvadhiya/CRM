// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: number;
  name: string;
  email: string;
  role: string;
  token: string;
}

export interface User {
  userId: number;
  name: string;
  email: string;
  role: 'Admin' | 'SalesPerson';
  phone?: string;
  profileImage?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

// Lead types
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';
export type LeadSource = 'Website' | 'Referral' | 'ColdCall' | 'Campaign' | 'SocialMedia' | 'Other';
export type LeadRating = 'Hot' | 'Warm' | 'Cold';

export interface Lead {
  leadId: number;
  companyName: string;
  contactName: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  leadSource?: LeadSource;
  status: LeadStatus;
  rating?: LeadRating;
  assignedTo?: number;
  estimatedValue?: number;
  expectedCloseDate?: string;
  notes?: string;
  convertedToCustomerId?: number;
  convertedDate?: string;
  lostReason?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  assignedToUser?: User;
}

// Customer types
export type CustomerType = 'Individual' | 'Business';

export interface Customer {
  customerId: number;
  leadId?: number;
  companyName: string;
  contactPerson: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  industry?: string;
  customerType: CustomerType;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
  billingPostalCode?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCountry?: string;
  shippingPostalCode?: string;
  gstNumber?: string;
  panNumber?: string;
  accountOwner?: number;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  accountOwnerUser?: User;
  orders?: Order[];
  subscriptions?: Subscription[];
}

// Product Variant types
export interface ProductVariant {
  variantId: number;
  variantName: string;
  variantCode: string;
  description?: string;
  basePriceSingleUser: number;
  basePriceMultiUser: number;
  annualSubscriptionFee: number;
  features?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

// Order types
export type OrderStatus = 'Draft' | 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Partial' | 'Paid';
export type UserLicenseType = 'SingleUser' | 'MultiUser';

export interface Order {
  orderId: number;
  orderNumber: string;
  customerId: number;
  variantId: number;
  userLicenseType: UserLicenseType;
  quantity: number;
  basePrice: number;
  baseAmount: number;
  customizationDetails?: string;
  customizationAmount: number;
  discountPercent: number;
  discountAmount: number;
  subTotal: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentTerms?: string;
  notes?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  productVariant?: ProductVariant;
  subscription?: Subscription;
}

// Subscription types
export type SubscriptionStatus = 'Active' | 'Expired' | 'Cancelled' | 'Suspended' | 'PendingRenewal';

export interface Subscription {
  subscriptionId: number;
  subscriptionNumber: string;
  customerId: number;
  orderId: number;
  variantId: number;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  renewalDate: string;
  annualFee: number;
  status: SubscriptionStatus;
  autoRenew: boolean;
  cancellationDate?: string;
  cancellationReason?: string;
  cancelledBy?: number;
  renewalCount: number;
  lastPaymentDate?: string;
  nextPaymentDueDate?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  order?: Order;
  productVariant?: ProductVariant;
}

// Activity types
export type ActivityType = 'Call' | 'Meeting' | 'Email' | 'Task' | 'Note';
export type ActivityStatus = 'Planned' | 'InProgress' | 'Completed' | 'Cancelled';
export type ActivityPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type RelatedToType = 'Lead' | 'Customer' | 'Order' | 'Subscription';

export interface Activity {
  activityId: number;
  activityType: ActivityType;
  subject?: string;
  description?: string;
  relatedToType: RelatedToType;
  relatedToId: number;
  activityDate: string;
  dueDate?: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  duration?: number;
  location?: string;
  outcome?: string;
  assignedTo?: number;
  createdBy: number;
  completedBy?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignedToUser?: User;
  createdByUser?: User;
}

// Notification types
export type NotificationType =
  | 'LeadAssigned'
  | 'LeadConverted'
  | 'OrderCreated'
  | 'OrderConfirmed'
  | 'SubscriptionCreated'
  | 'SubscriptionRenewalDue'
  | 'SubscriptionExpired'
  | 'TaskAssigned'
  | 'ActivityOverdue'
  | 'SystemAlert';

export type NotificationPriority = 'Low' | 'Medium' | 'High';

export interface Notification {
  notificationId: number;
  userId: number;
  notificationType: NotificationType;
  title: string;
  message: string;
  relatedToType?: RelatedToType;
  relatedToId?: number;
  isRead: boolean;
  readAt?: string;
  priority: NotificationPriority;
  shouldSendEmail: boolean;
  emailSent: boolean;
  emailSentAt?: string;
  createdAt: string;
}

// Dashboard types
export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  leadConversionRate: number;
  totalCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalRevenue: number;
  upcomingRenewals30Days: number;
  upcomingRenewals90Days: number;
}
