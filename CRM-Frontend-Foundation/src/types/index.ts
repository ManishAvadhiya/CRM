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

// Auth - Password Reset types
export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

// Auth - Password Change types
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// User Profile types
export interface UserProfile {
  userId: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  profileImage?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface User {
  userId: number;
  name: string;
  email: string;
  role: 'ManagementAdmin' | 'Marketing' | 'Partner';
  phone?: string;
  profileImage?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

// Lead types
export type LeadStatus = 'New' | 'Demo' | 'Converted' | 'Lost';
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
  createdByUser?: User;
}

// Lead History types
export type HistoryChangeType = 
  | 'StatusChanged' 
  | 'NoteAdded' 
  | 'AssignmentChanged' 
  | 'DetailsAdded' 
  | 'RatingChanged' 
  | 'ConvertedToCustomer' 
  | 'Other';

export interface LeadHistory {
  historyId: number;
  leadId: number;
  changedByUserId: number;
  changedByUserName: string;
  changeType: HistoryChangeType;
  oldValue?: string;
  newValue?: string;
  description?: string;
  changedAt: string;
}

export interface LeadDetailResponse {
  leadId: number;
  companyName: string;
  contactName: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  leadSource?: string;
  status: string;
  rating?: string;
  assignedTo?: number;
  assignedToName?: string;
  estimatedValue?: number;
  expectedCloseDate?: string;
  notes?: string;
  convertedToCustomerId?: number;
  convertedDate?: string;
  lostReason?: string;
  createdBy?: number;
  createdByName?: string;
  updatedByUserId?: number;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
  history: LeadHistory[];
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
  customerType: CustomerType | number;
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
export type OrderType = 'New' | 'Renew';

export interface Order {
  orderId: number;
  orderNumber: string;
  customerId: number;
  variantId: number;
  orderType: OrderType | number;
  renewedSubscriptionId?: number;
  userLicenseType: UserLicenseType | number;
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
  status: OrderStatus | number;
  paymentStatus: PaymentStatus | number;
  paymentTerms?: string;
  notes?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  productVariant?: ProductVariant;
  subscription?: Subscription;
  renewedSubscription?: Subscription;
  createdByUser?: User;
}

export interface PartnerEarning {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  orderAmount: number;
  commissionRate: number;
  earningAmount: number;
  status: string;
}

// Subscription types
export type SubscriptionStatus = 'Active' | 'Expired' | 'Cancelled' | 'Suspended' | 'PendingRenewal';
export type SubscriptionChangeType = 'Created' | 'Renewed' | 'Cancelled' | 'Suspended' | 'Reactivated' | 'Expired' | 'VariantChanged' | 'Other';

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
  status: SubscriptionStatus | number;
  autoRenew: boolean;
  cancellationDate?: string;
  cancellationReason?: string;
  cancelledBy?: number;
  suspensionDate?: string;
  suspensionReason?: string;
  suspendedBy?: number;
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

export interface SubscriptionHistory {
  historyId: number;
  subscriptionId: number;
  changeType: SubscriptionChangeType | string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  relatedOrderId?: number;
  relatedOrderNumber?: string;
  changedAt: string;
  changedByUserName: string;
}

export interface CancelSubscriptionRequest {
  cancellationReason: string;
}

export interface SuspendSubscriptionRequest {
  suspensionReason: string;
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

export interface ActivityListItem {
  activityId: number;
  name: string;
  type: ActivityType | number;
  description?: string;
  outcome?: string;
  date: string;
  nextFollowUp?: string;
  createdBy: string;
  relatedToType: RelatedToType | number;
  relatedToId: number;
}

export interface CreateActivityRequest {
  activityType: ActivityType | number;
  subject?: string;
  description?: string;
  relatedToType: RelatedToType | number;
  relatedToId: number;
  activityDate: string;
  dueDate?: string;
  status?: ActivityStatus | number;
  priority?: ActivityPriority | number;
  duration?: number;
  location?: string;
  outcome?: string;
  assignedTo?: number;
}

export interface UpdateActivityRequest {
  activityType: ActivityType | number;
  subject?: string;
  description?: string;
  activityDate: string;
  dueDate?: string;
  status: ActivityStatus | number;
  priority: ActivityPriority | number;
  duration?: number;
  location?: string;
  outcome?: string;
  assignedTo?: number;
}

// Notification types
export type NotificationType =
  | 'LeadAssigned'
  | 'LeadConverted'
  | 'FollowUpDue'
  | 'OrderCreated'
  | 'OrderConfirmed'
  | 'PaymentReceived'
  | 'SubscriptionCreated'
  | 'SubscriptionRenewalDue'
  | 'SubscriptionExpired'
  | 'SubscriptionRenewed'
  | 'SubscriptionCancelled'
  | 'SubscriptionSuspended'
  | 'SubscriptionReactivated'
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
  demoLeads: number;
  convertedLeads: number;
  lostLeads: number;
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
  totalEarnings: number;
  upcomingRenewals30Days: number;
  upcomingRenewals90Days: number;
}

// Advanced Dashboard Types

// Revenue Analytics
export interface MonthlyRevenue {
  year: number;
  month: number;
  monthName: string;
  revenue: number;
  orderCount: number;
  growthPercent: number;
}

export interface PaymentStatusBreakdown {
  status: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueThisQuarter: number;
  revenueThisYear: number;
  averageOrderValue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  pendingRevenue: number;
  revenueGrowthMoM: number;
  revenueGrowthYoY: number;
  projectedRevenue30Days: number;
  projectedRevenue90Days: number;
  monthlyRevenue: MonthlyRevenue[];
  paymentBreakdown: PaymentStatusBreakdown[];
}

// Customer Analytics
export interface TopCustomer {
  customerId: number;
  companyName: string;
  industry: string;
  totalRevenue: number;
  totalOrders: number;
  activeSubscriptions: number;
  customerSince: string;
  healthScore: string;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  totalRevenue: number;
  averageRevenue: number;
  percentage: number;
}

export interface IndustryBreakdown {
  industry: string;
  customerCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  dormantCustomers: number;
  newCustomersThisMonth: number;
  newCustomersThisYear: number;
  averageCustomerLifetimeValue: number;
  medianCustomerLifetimeValue: number;
  customerRetentionRate: number;
  churnRate: number;
  repeatPurchaseRate: number;
  averageCustomerAgeMonths: number;
  topCustomersByRevenue: TopCustomer[];
  customerSegments: CustomerSegment[];
  industryBreakdown: IndustryBreakdown[];
}

// Sales Pipeline
export interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  conversionToNext: number;
  averageDaysInStage: number;
}

export interface LeadSourcePerformance {
  source: string;
  leadCount: number;
  convertedCount: number;
  conversionRate: number;
  totalRevenue: number;
  averageDealSize: number;
  averageSalesCycleDays: number;
}

export interface LeadRatingPerformance {
  rating: string;
  count: number;
  convertedCount: number;
  conversionRate: number;
  averageValue: number;
}

export interface LostReasonAnalysis {
  reason: string;
  count: number;
  lostValue: number;
  percentage: number;
}

export interface SalesPipeline {
  totalPipelineValue: number;
  totalLeadsInPipeline: number;
  averageDealSize: number;
  averageSalesCycleDays: number;
  winRate: number;
  lossRate: number;
  demoToConversionRate: number;
  pipelineStages: PipelineStage[];
  leadSourcePerformance: LeadSourcePerformance[];
  leadRatingPerformance: LeadRatingPerformance[];
  lostReasonAnalysis: LostReasonAnalysis[];
}

// Product Analytics
export interface ProductPerformance {
  variantId: number;
  variantName: string;
  variantCode: string;
  totalOrders: number;
  activeSubscriptions: number;
  totalRevenue: number;
  averageOrderValue: number;
  marketShare: number;
  growthRate: number;
}

export interface LicenseTypeDistribution {
  licenseType: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface ProductAnalytics {
  totalProducts: number;
  activeProducts: number;
  productPerformance: ProductPerformance[];
  licenseTypeDistribution: LicenseTypeDistribution[];
  totalCustomizationRevenue: number;
  averageDiscountPercent: number;
  totalDiscountGiven: number;
}

// Partner Performance
export interface PartnerLeaderboard {
  userId: number;
  name: string;
  email: string;
  leadsCreated: number;
  leadsConverted: number;
  conversionRate: number;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  rank: number;
}

export interface PartnerActivity {
  userId: number;
  name: string;
  leadsThisMonth: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  lastActivityDate?: string;
  activityLevel: string;
}

export interface MonthlyPartnerRevenue {
  month: number;
  monthName: string;
  year: number;
  totalRevenue: number;
  totalCommission: number;
  orderCount: number;
}

export interface PartnerPerformance {
  totalPartners: number;
  activePartners: number;
  totalPartnerRevenue: number;
  totalCommissionsPaid: number;
  topPartners: PartnerLeaderboard[];
  partnerActivity: PartnerActivity[];
  monthlyPartnerRevenue: MonthlyPartnerRevenue[];
}

// Subscription Analytics
export interface SubscriptionStatusBreakdown {
  status: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface RenewalForecast {
  period: string;
  daysFromNow: number;
  subscriptionCount: number;
  expectedRevenue: number;
  atRiskCount: number;
}

export interface CancellationReason {
  reason: string;
  count: number;
  lostRevenue: number;
  percentage: number;
}

export interface SuspensionReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface RenewalDistribution {
  renewalCount: number;
  subscriptionCount: number;
  percentage: number;
}

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  suspendedSubscriptions: number;
  pendingRenewalSubscriptions: number;
  subscriptionRenewalRate: number;
  averageSubscriptionDuration: number;
  autoRenewEnabled: number;
  autoRenewDisabled: number;
  totalSubscriptionRevenue: number;
  averageAnnualFee: number;
  churnRate: number;
  statusBreakdown: SubscriptionStatusBreakdown[];
  renewalForecast: RenewalForecast[];
  cancellationReasons: CancellationReason[];
  suspensionReasons: SuspensionReason[];
  renewalDistribution: RenewalDistribution[];
}

// Activity Analytics
export interface ActivityTypeBreakdown {
  type: string;
  count: number;
  completed: number;
  completionRate: number;
  averageDuration: number;
}

export interface ActivityTrend {
  period: string;
  planned: number;
  completed: number;
  cancelled: number;
}

export interface UserProductivity {
  userId: number;
  userName: string;
  totalActivities: number;
  completedActivities: number;
  completionRate: number;
  averageResponseTimeHours: number;
}

export interface ActivityAnalytics {
  totalActivities: number;
  completedActivities: number;
  pendingActivities: number;
  overdueActivities: number;
  completionRate: number;
  averageActivitiesPerLead: number;
  averageActivitiesPerCustomer: number;
  activityTypeBreakdown: ActivityTypeBreakdown[];
  weeklyTrend: ActivityTrend[];
  userProductivity: UserProductivity[];
}

// Geographic Analytics
export interface StateRevenue {
  state: string;
  customerCount: number;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface CountryRevenue {
  country: string;
  customerCount: number;
  totalRevenue: number;
}

export interface CityRevenue {
  city: string;
  state: string;
  customerCount: number;
  totalRevenue: number;
}

export interface GeographicAnalytics {
  revenueByState: StateRevenue[];
  revenueByCountry: CountryRevenue[];
  topCities: CityRevenue[];
}

// Time-Based Analytics
export interface QuarterlyPerformance {
  year: number;
  quarter: number;
  revenue: number;
  orderCount: number;
  leadCount: number;
  growthPercent: number;
}

export interface DayOfWeekPerformance {
  dayOfWeek: string;
  dayNumber: number;
  leadCount: number;
  orderCount: number;
  conversionCount: number;
  averageOrderValue: number;
}

export interface YearOverYearComparison {
  metric: string;
  currentYearValue: number;
  previousYearValue: number;
  growthPercent: number;
}

export interface TimeBasedAnalytics {
  quarterlyPerformance: QuarterlyPerformance[];
  dayOfWeekPerformance: DayOfWeekPerformance[];
  yearOverYearComparison: YearOverYearComparison[];
  averageTimeToFirstOrderDays: number;
  averageOrderFulfillmentDays: number;
}

// Financial Health
export interface OutstandingByCustomer {
  customerId: number;
  companyName: string;
  outstandingAmount: number;
  pendingOrderCount: number;
  daysOutstanding: number;
}

export interface CashFlowProjection {
  period: string;
  expectedInflow: number;
  renewalRevenue: number;
  newBusinessRevenue: number;
}

export interface FinancialHealth {
  totalOutstandingAmount: number;
  outstandingWithin30Days: number;
  outstanding30To60Days: number;
  outstandingOver60Days: number;
  totalTaxCollected: number;
  totalDiscountsGiven: number;
  revenueAtRisk: number;
  topOutstandingCustomers: OutstandingByCustomer[];
  cashFlowProjection: CashFlowProjection[];
}

// Dashboard Alerts
export interface AlertItem {
  type: string;
  severity: string;
  title: string;
  description: string;
  relatedId?: number;
  relatedEntity: string;
  dueDate?: string;
  amount?: number;
}

export interface DashboardAlerts {
  expiringSubscriptions: AlertItem[];
  overduePayments: AlertItem[];
  staleLeads: AlertItem[];
  overdueActivities: AlertItem[];
  criticalAlertCount: number;
  warningAlertCount: number;
  infoAlertCount: number;
}

// Comprehensive Dashboard Stats
export interface AdvancedDashboardStats {
  revenue: RevenueAnalytics;
  customers: CustomerAnalytics;
  pipeline: SalesPipeline;
  products: ProductAnalytics;
  partners: PartnerPerformance;
  subscriptions: SubscriptionAnalytics;
  activities: ActivityAnalytics;
  geographic: GeographicAnalytics;
  timeBased: TimeBasedAnalytics;
  financialHealth: FinancialHealth;
  alerts: DashboardAlerts;
  generatedAt: string;
}
