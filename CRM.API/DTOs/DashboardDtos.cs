namespace CRM.API.DTOs;

// Revenue Analysis & Forecasting
public class RevenueAnalyticsDto
{
    public decimal TotalRevenue { get; set; }
    public decimal RevenueThisMonth { get; set; }
    public decimal RevenueLastMonth { get; set; }
    public decimal RevenueThisQuarter { get; set; }
    public decimal RevenueThisYear { get; set; }
    public decimal AverageOrderValue { get; set; }
    public decimal MonthlyRecurringRevenue { get; set; }
    public decimal AnnualRecurringRevenue { get; set; }
    public decimal PendingRevenue { get; set; }
    public decimal RevenueGrowthMoM { get; set; }
    public decimal RevenueGrowthYoY { get; set; }
    public decimal ProjectedRevenue30Days { get; set; }
    public decimal ProjectedRevenue90Days { get; set; }
    public List<MonthlyRevenueDto> MonthlyRevenue { get; set; } = new();
    public List<PaymentStatusBreakdownDto> PaymentBreakdown { get; set; } = new();
}

public class MonthlyRevenueDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int OrderCount { get; set; }
    public decimal GrowthPercent { get; set; }
}

public class PaymentStatusBreakdownDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }
}

// Customer Lifetime Value & Retention
public class CustomerAnalyticsDto
{
    public int TotalCustomers { get; set; }
    public int ActiveCustomers { get; set; }
    public int DormantCustomers { get; set; }
    public int NewCustomersThisMonth { get; set; }
    public int NewCustomersThisYear { get; set; }
    public decimal AverageCustomerLifetimeValue { get; set; }
    public decimal MedianCustomerLifetimeValue { get; set; }
    public decimal CustomerRetentionRate { get; set; }
    public decimal ChurnRate { get; set; }
    public decimal RepeatPurchaseRate { get; set; }
    public double AverageCustomerAgeMonths { get; set; }
    public List<TopCustomerDto> TopCustomersByRevenue { get; set; } = new();
    public List<CustomerSegmentDto> CustomerSegments { get; set; } = new();
    public List<IndustryBreakdownDto> IndustryBreakdown { get; set; } = new();
}

public class TopCustomerDto
{
    public int CustomerId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string Industry { get; set; } = string.Empty;
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int ActiveSubscriptions { get; set; }
    public string CustomerSince { get; set; } = string.Empty;
    public string HealthScore { get; set; } = string.Empty;
}

public class CustomerSegmentDto
{
    public string Segment { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageRevenue { get; set; }
    public decimal Percentage { get; set; }
}

public class IndustryBreakdownDto
{
    public string Industry { get; set; } = string.Empty;
    public int CustomerCount { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public decimal ConversionRate { get; set; }
}

// Sales Performance & Pipeline
public class SalesPipelineDto
{
    public decimal TotalPipelineValue { get; set; }
    public int TotalLeadsInPipeline { get; set; }
    public decimal AverageDealSize { get; set; }
    public double AverageSalesCycleDays { get; set; }
    public decimal WinRate { get; set; }
    public decimal LossRate { get; set; }
    public decimal DemoToConversionRate { get; set; }
    public List<PipelineStageDto> PipelineStages { get; set; } = new();
    public List<LeadSourcePerformanceDto> LeadSourcePerformance { get; set; } = new();
    public List<LeadRatingPerformanceDto> LeadRatingPerformance { get; set; } = new();
    public List<LostReasonAnalysisDto> LostReasonAnalysis { get; set; } = new();
}

public class PipelineStageDto
{
    public string Stage { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Value { get; set; }
    public decimal ConversionToNext { get; set; }
    public double AverageDaysInStage { get; set; }
}

public class LeadSourcePerformanceDto
{
    public string Source { get; set; } = string.Empty;
    public int LeadCount { get; set; }
    public int ConvertedCount { get; set; }
    public decimal ConversionRate { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageDealSize { get; set; }
    public double AverageSalesCycleDays { get; set; }
}

public class LeadRatingPerformanceDto
{
    public string Rating { get; set; } = string.Empty;
    public int Count { get; set; }
    public int ConvertedCount { get; set; }
    public decimal ConversionRate { get; set; }
    public decimal AverageValue { get; set; }
}

public class LostReasonAnalysisDto
{
    public string Reason { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal LostValue { get; set; }
    public decimal Percentage { get; set; }
}

// Product & Variant Analysis
public class ProductAnalyticsDto
{
    public int TotalProducts { get; set; }
    public int ActiveProducts { get; set; }
    public List<ProductPerformanceDto> ProductPerformance { get; set; } = new();
    public List<LicenseTypeDistributionDto> LicenseTypeDistribution { get; set; } = new();
    public decimal TotalCustomizationRevenue { get; set; }
    public decimal AverageDiscountPercent { get; set; }
    public decimal TotalDiscountGiven { get; set; }
}

public class ProductPerformanceDto
{
    public int VariantId { get; set; }
    public string VariantName { get; set; } = string.Empty;
    public string VariantCode { get; set; } = string.Empty;
    public int TotalOrders { get; set; }
    public int ActiveSubscriptions { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public decimal MarketShare { get; set; }
    public decimal GrowthRate { get; set; }
}

public class LicenseTypeDistributionDto
{
    public string LicenseType { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Revenue { get; set; }
    public decimal Percentage { get; set; }
}

// Partner Performance
public class PartnerPerformanceDto
{
    public int TotalPartners { get; set; }
    public int ActivePartners { get; set; }
    public decimal TotalPartnerRevenue { get; set; }
    public decimal TotalCommissionsPaid { get; set; }
    public List<PartnerLeaderboardDto> TopPartners { get; set; } = new();
    public List<PartnerActivityDto> PartnerActivity { get; set; } = new();
    public List<MonthlyPartnerRevenueDto> MonthlyPartnerRevenue { get; set; } = new();
}

public class PartnerLeaderboardDto
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int LeadsCreated { get; set; }
    public int LeadsConverted { get; set; }
    public decimal ConversionRate { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalCommission { get; set; }
    public int Rank { get; set; }
}

public class PartnerActivityDto
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int LeadsThisMonth { get; set; }
    public int OrdersThisMonth { get; set; }
    public decimal RevenueThisMonth { get; set; }
    public DateTime? LastActivityDate { get; set; }
    public string ActivityLevel { get; set; } = string.Empty;
}

public class MonthlyPartnerRevenueDto
{
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public int Year { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalCommission { get; set; }
    public int OrderCount { get; set; }
}

// Subscription Insights
public class SubscriptionAnalyticsDto
{
    public int TotalSubscriptions { get; set; }
    public int ActiveSubscriptions { get; set; }
    public int ExpiredSubscriptions { get; set; }
    public int CancelledSubscriptions { get; set; }
    public int SuspendedSubscriptions { get; set; }
    public int PendingRenewalSubscriptions { get; set; }
    public decimal SubscriptionRenewalRate { get; set; }
    public double AverageSubscriptionDuration { get; set; }
    public int AutoRenewEnabled { get; set; }
    public int AutoRenewDisabled { get; set; }
    public decimal TotalSubscriptionRevenue { get; set; }
    public decimal AverageAnnualFee { get; set; }
    public decimal ChurnRate { get; set; }
    public List<SubscriptionStatusBreakdownDto> StatusBreakdown { get; set; } = new();
    public List<RenewalForecastDto> RenewalForecast { get; set; } = new();
    public List<CancellationReasonDto> CancellationReasons { get; set; } = new();
    public List<SuspensionReasonDto> SuspensionReasons { get; set; } = new();
    public List<RenewalDistributionDto> RenewalDistribution { get; set; } = new();
}

public class SubscriptionStatusBreakdownDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Revenue { get; set; }
    public decimal Percentage { get; set; }
}

public class RenewalForecastDto
{
    public string Period { get; set; } = string.Empty;
    public int DaysFromNow { get; set; }
    public int SubscriptionCount { get; set; }
    public decimal ExpectedRevenue { get; set; }
    public int AtRiskCount { get; set; }
}

public class CancellationReasonDto
{
    public string Reason { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal LostRevenue { get; set; }
    public decimal Percentage { get; set; }
}

public class SuspensionReasonDto
{
    public string Reason { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class RenewalDistributionDto
{
    public int RenewalCount { get; set; }
    public int SubscriptionCount { get; set; }
    public decimal Percentage { get; set; }
}

// Activity & Productivity
public class ActivityAnalyticsDto
{
    public int TotalActivities { get; set; }
    public int CompletedActivities { get; set; }
    public int PendingActivities { get; set; }
    public int OverdueActivities { get; set; }
    public decimal CompletionRate { get; set; }
    public double AverageActivitiesPerLead { get; set; }
    public double AverageActivitiesPerCustomer { get; set; }
    public List<ActivityTypeBreakdownDto> ActivityTypeBreakdown { get; set; } = new();
    public List<ActivityTrendDto> WeeklyTrend { get; set; } = new();
    public List<UserProductivityDto> UserProductivity { get; set; } = new();
}

public class ActivityTypeBreakdownDto
{
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
    public int Completed { get; set; }
    public decimal CompletionRate { get; set; }
    public double AverageDuration { get; set; }
}

public class ActivityTrendDto
{
    public string Period { get; set; } = string.Empty;
    public int Planned { get; set; }
    public int Completed { get; set; }
    public int Cancelled { get; set; }
}

public class UserProductivityDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int TotalActivities { get; set; }
    public int CompletedActivities { get; set; }
    public decimal CompletionRate { get; set; }
    public double AverageResponseTimeHours { get; set; }
}

// Geographic & Industry Insights
public class GeographicAnalyticsDto
{
    public List<StateRevenueDto> RevenueByState { get; set; } = new();
    public List<CountryRevenueDto> RevenueByCountry { get; set; } = new();
    public List<CityRevenueDto> TopCities { get; set; } = new();
}

public class StateRevenueDto
{
    public string State { get; set; } = string.Empty;
    public int CustomerCount { get; set; }
    public decimal TotalRevenue { get; set; }
    public int OrderCount { get; set; }
    public decimal AverageOrderValue { get; set; }
}

public class CountryRevenueDto
{
    public string Country { get; set; } = string.Empty;
    public int CustomerCount { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class CityRevenueDto
{
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public int CustomerCount { get; set; }
    public decimal TotalRevenue { get; set; }
}

// Time-Based Insights
public class TimeBasedAnalyticsDto
{
    public List<QuarterlyPerformanceDto> QuarterlyPerformance { get; set; } = new();
    public List<DayOfWeekPerformanceDto> DayOfWeekPerformance { get; set; } = new();
    public List<YearOverYearComparisonDto> YearOverYearComparison { get; set; } = new();
    public double AverageTimeToFirstOrderDays { get; set; }
    public double AverageOrderFulfillmentDays { get; set; }
}

public class QuarterlyPerformanceDto
{
    public int Year { get; set; }
    public int Quarter { get; set; }
    public decimal Revenue { get; set; }
    public int OrderCount { get; set; }
    public int LeadCount { get; set; }
    public decimal GrowthPercent { get; set; }
}

public class DayOfWeekPerformanceDto
{
    public string DayOfWeek { get; set; } = string.Empty;
    public int DayNumber { get; set; }
    public int LeadCount { get; set; }
    public int OrderCount { get; set; }
    public int ConversionCount { get; set; }
    public decimal AverageOrderValue { get; set; }
}

public class YearOverYearComparisonDto
{
    public string Metric { get; set; } = string.Empty;
    public decimal CurrentYearValue { get; set; }
    public decimal PreviousYearValue { get; set; }
    public decimal GrowthPercent { get; set; }
}

// Financial Health
public class FinancialHealthDto
{
    public decimal TotalOutstandingAmount { get; set; }
    public decimal OutstandingWithin30Days { get; set; }
    public decimal Outstanding30To60Days { get; set; }
    public decimal OutstandingOver60Days { get; set; }
    public decimal TotalTaxCollected { get; set; }
    public decimal TotalDiscountsGiven { get; set; }
    public decimal RevenueAtRisk { get; set; }
    public List<OutstandingByCustomerDto> TopOutstandingCustomers { get; set; } = new();
    public List<CashFlowProjectionDto> CashFlowProjection { get; set; } = new();
}

public class OutstandingByCustomerDto
{
    public int CustomerId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public decimal OutstandingAmount { get; set; }
    public int PendingOrderCount { get; set; }
    public int DaysOutstanding { get; set; }
}

public class CashFlowProjectionDto
{
    public string Period { get; set; } = string.Empty;
    public decimal ExpectedInflow { get; set; }
    public decimal RenewalRevenue { get; set; }
    public decimal NewBusinessRevenue { get; set; }
}

// Alerts & Action Items
public class DashboardAlertsDto
{
    public List<AlertItemDto> ExpiringSubscriptions { get; set; } = new();
    public List<AlertItemDto> OverduePayments { get; set; } = new();
    public List<AlertItemDto> StaleLeads { get; set; } = new();
    public List<AlertItemDto> OverdueActivities { get; set; } = new();
    public int CriticalAlertCount { get; set; }
    public int WarningAlertCount { get; set; }
    public int InfoAlertCount { get; set; }
}

public class AlertItemDto
{
    public string Type { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? RelatedId { get; set; }
    public string RelatedEntity { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public decimal? Amount { get; set; }
}

// Comprehensive Dashboard Stats
public class AdvancedDashboardStatsDto
{
    public RevenueAnalyticsDto Revenue { get; set; } = new();
    public CustomerAnalyticsDto Customers { get; set; } = new();
    public SalesPipelineDto Pipeline { get; set; } = new();
    public ProductAnalyticsDto Products { get; set; } = new();
    public PartnerPerformanceDto Partners { get; set; } = new();
    public SubscriptionAnalyticsDto Subscriptions { get; set; } = new();
    public ActivityAnalyticsDto Activities { get; set; } = new();
    public GeographicAnalyticsDto Geographic { get; set; } = new();
    public TimeBasedAnalyticsDto TimeBased { get; set; } = new();
    public FinancialHealthDto FinancialHealth { get; set; } = new();
    public DashboardAlertsDto Alerts { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
