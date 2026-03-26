using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.DTOs;
using CRM.API.Models;
using System.Globalization;

namespace CRM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DashboardController> _logger;
    private const decimal CommissionRate = 10m;

    public DashboardController(ApplicationDbContext context, ILogger<DashboardController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "";
    }

    private bool IsPartner() => GetCurrentUserRole() == "Partner";

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<DashboardStats>>> GetStats()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var stats = new DashboardStats();

            if (userRole == "Partner")
            {
                var partnerLeads = _context.Leads.Where(l => l.CreatedBy == currentUserId);
                var partnerOrders = _context.Orders.Where(o => o.CreatedBy == currentUserId);
                var partnerSubscriptions = _context.Subscriptions.Include(s => s.Order).Where(s => s.Order.CreatedBy == currentUserId);

                stats.TotalLeads = await partnerLeads.CountAsync();
                stats.NewLeads = await partnerLeads.CountAsync(l => l.Status == LeadStatus.New);
                stats.DemoLeads = await partnerLeads.CountAsync(l => l.Status == LeadStatus.Demo);
                stats.ConvertedLeads = await partnerLeads.CountAsync(l => l.Status == LeadStatus.Converted);
                stats.LostLeads = await partnerLeads.CountAsync(l => l.Status == LeadStatus.Lost);

                stats.TotalCustomers = await _context.Customers.CountAsync(c => c.CreatedBy == currentUserId);

                stats.TotalOrders = await partnerOrders.CountAsync();
                stats.PendingOrders = await partnerOrders.CountAsync(o => o.Status == OrderStatus.Pending);
                stats.ConfirmedOrders = await partnerOrders.CountAsync(o => o.Status == OrderStatus.Confirmed);
                stats.DeliveredOrders = await partnerOrders.CountAsync(o => o.Status == OrderStatus.PaymentReceived);

                stats.TotalSubscriptions = await partnerSubscriptions.CountAsync();
                stats.ActiveSubscriptions = await partnerSubscriptions.CountAsync(s => s.Status == SubscriptionStatus.Active);
                stats.ExpiredSubscriptions = await partnerSubscriptions.CountAsync(s => s.Status == SubscriptionStatus.Expired);

                stats.TotalRevenue = await partnerOrders
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
                    .SumAsync(o => o.TotalAmount);

                stats.TotalEarnings = Math.Round(stats.TotalRevenue * CommissionRate / 100m, 2);

                stats.UpcomingRenewals30Days = await partnerSubscriptions
                    .CountAsync(s => s.Status == SubscriptionStatus.Active &&
                                   s.RenewalDate >= DateTime.UtcNow.Date &&
                                   s.RenewalDate <= DateTime.UtcNow.Date.AddDays(30));

                stats.UpcomingRenewals90Days = await partnerSubscriptions
                    .CountAsync(s => s.Status == SubscriptionStatus.Active &&
                                   s.RenewalDate >= DateTime.UtcNow.Date &&
                                   s.RenewalDate <= DateTime.UtcNow.Date.AddDays(90));
            }
            else
            {
                stats.TotalLeads = await _context.Leads.CountAsync();
                stats.NewLeads = await _context.Leads.CountAsync(l => l.Status == LeadStatus.New);
                stats.DemoLeads = await _context.Leads.CountAsync(l => l.Status == LeadStatus.Demo);
                stats.ConvertedLeads = await _context.Leads.CountAsync(l => l.Status == LeadStatus.Converted);
                stats.LostLeads = await _context.Leads.CountAsync(l => l.Status == LeadStatus.Lost);

                stats.TotalCustomers = await _context.Customers.CountAsync();

                stats.TotalOrders = await _context.Orders.CountAsync();
                stats.PendingOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Pending);
                stats.ConfirmedOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Confirmed);
                stats.DeliveredOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.PaymentReceived);

                stats.TotalSubscriptions = await _context.Subscriptions.CountAsync();
                stats.ActiveSubscriptions = await _context.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Active);
                stats.ExpiredSubscriptions = await _context.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Expired);

                stats.TotalRevenue = await _context.Orders
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
                    .SumAsync(o => o.TotalAmount);

                stats.TotalEarnings = 0;

                stats.UpcomingRenewals30Days = await _context.Subscriptions
                    .CountAsync(s => s.Status == SubscriptionStatus.Active &&
                                   s.RenewalDate >= DateTime.UtcNow.Date &&
                                   s.RenewalDate <= DateTime.UtcNow.Date.AddDays(30));

                stats.UpcomingRenewals90Days = await _context.Subscriptions
                    .CountAsync(s => s.Status == SubscriptionStatus.Active &&
                                   s.RenewalDate >= DateTime.UtcNow.Date &&
                                   s.RenewalDate <= DateTime.UtcNow.Date.AddDays(90));
            }

            if (stats.TotalLeads > 0)
            {
                stats.LeadConversionRate = (decimal)stats.ConvertedLeads / stats.TotalLeads * 100;
            }

            return Ok(ApiResponse<DashboardStats>.SuccessResponse(stats));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching dashboard stats: {ex.Message}");
            return StatusCode(500, ApiResponse<DashboardStats>.ErrorResponse("Error fetching dashboard stats"));
        }
    }

    [HttpGet("recent-activities")]
    public async Task<ActionResult<ApiResponse<List<Activity>>>> GetRecentActivities([FromQuery] int count = 10)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var query = _context.Activities
                .Include(a => a.CreatedByUser)
                .AsQueryable();

            if (userRole == "Partner")
            {
                query = query.Where(a => a.CreatedBy == currentUserId);
            }

            var activities = await query
                .OrderByDescending(a => a.ActivityDate)
                .Take(count)
                .ToListAsync();

            return Ok(ApiResponse<List<Activity>>.SuccessResponse(activities));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching recent activities: {ex.Message}");
            return StatusCode(500, ApiResponse<List<Activity>>.ErrorResponse("Error fetching recent activities"));
        }
    }

    [HttpGet("advanced-stats")]
    public async Task<ActionResult<ApiResponse<AdvancedDashboardStatsDto>>> GetAdvancedStats()
    {
        try
        {
            var stats = new AdvancedDashboardStatsDto
            {
                Revenue = await GetRevenueAnalytics(),
                Customers = await GetCustomerAnalytics(),
                Pipeline = await GetSalesPipeline(),
                Products = await GetProductAnalytics(),
                Partners = await GetPartnerPerformance(),
                Subscriptions = await GetSubscriptionAnalytics(),
                Activities = await GetActivityAnalytics(),
                Geographic = await GetGeographicAnalytics(),
                TimeBased = await GetTimeBasedAnalytics(),
                FinancialHealth = await GetFinancialHealth(),
                Alerts = await GetDashboardAlerts(),
                GeneratedAt = DateTime.UtcNow
            };

            return Ok(ApiResponse<AdvancedDashboardStatsDto>.SuccessResponse(stats));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching advanced dashboard stats: {ex.Message}");
            return StatusCode(500, ApiResponse<AdvancedDashboardStatsDto>.ErrorResponse("Error fetching advanced stats"));
        }
    }

    [HttpGet("revenue-analytics")]
    public async Task<ActionResult<ApiResponse<RevenueAnalyticsDto>>> GetRevenueAnalyticsEndpoint()
    {
        try
        {
            var analytics = await GetRevenueAnalytics();
            return Ok(ApiResponse<RevenueAnalyticsDto>.SuccessResponse(analytics));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching revenue analytics: {ex.Message}");
            return StatusCode(500, ApiResponse<RevenueAnalyticsDto>.ErrorResponse("Error fetching revenue analytics"));
        }
    }

    [HttpGet("customer-analytics")]
    public async Task<ActionResult<ApiResponse<CustomerAnalyticsDto>>> GetCustomerAnalyticsEndpoint()
    {
        try
        {
            var analytics = await GetCustomerAnalytics();
            return Ok(ApiResponse<CustomerAnalyticsDto>.SuccessResponse(analytics));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching customer analytics: {ex.Message}");
            return StatusCode(500, ApiResponse<CustomerAnalyticsDto>.ErrorResponse("Error fetching customer analytics"));
        }
    }

    [HttpGet("sales-pipeline")]
    public async Task<ActionResult<ApiResponse<SalesPipelineDto>>> GetSalesPipelineEndpoint()
    {
        try
        {
            var pipeline = await GetSalesPipeline();
            return Ok(ApiResponse<SalesPipelineDto>.SuccessResponse(pipeline));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching sales pipeline: {ex.Message}");
            return StatusCode(500, ApiResponse<SalesPipelineDto>.ErrorResponse("Error fetching sales pipeline"));
        }
    }

    [HttpGet("product-analytics")]
    public async Task<ActionResult<ApiResponse<ProductAnalyticsDto>>> GetProductAnalyticsEndpoint()
    {
        try
        {
            var analytics = await GetProductAnalytics();
            return Ok(ApiResponse<ProductAnalyticsDto>.SuccessResponse(analytics));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching product analytics: {ex.Message}");
            return StatusCode(500, ApiResponse<ProductAnalyticsDto>.ErrorResponse("Error fetching product analytics"));
        }
    }

    [HttpGet("partner-performance")]
    public async Task<ActionResult<ApiResponse<PartnerPerformanceDto>>> GetPartnerPerformanceEndpoint()
    {
        try
        {
            var performance = await GetPartnerPerformance();
            return Ok(ApiResponse<PartnerPerformanceDto>.SuccessResponse(performance));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching partner performance: {ex.Message}");
            return StatusCode(500, ApiResponse<PartnerPerformanceDto>.ErrorResponse("Error fetching partner performance"));
        }
    }

    [HttpGet("subscription-analytics")]
    public async Task<ActionResult<ApiResponse<SubscriptionAnalyticsDto>>> GetSubscriptionAnalyticsEndpoint()
    {
        try
        {
            var analytics = await GetSubscriptionAnalytics();
            return Ok(ApiResponse<SubscriptionAnalyticsDto>.SuccessResponse(analytics));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching subscription analytics: {ex.Message}");
            return StatusCode(500, ApiResponse<SubscriptionAnalyticsDto>.ErrorResponse("Error fetching subscription analytics"));
        }
    }

    [HttpGet("activity-analytics")]
    public async Task<ActionResult<ApiResponse<ActivityAnalyticsDto>>> GetActivityAnalyticsEndpoint()
    {
        try
        {
            var analytics = await GetActivityAnalytics();
            return Ok(ApiResponse<ActivityAnalyticsDto>.SuccessResponse(analytics));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching activity analytics: {ex.Message}");
            return StatusCode(500, ApiResponse<ActivityAnalyticsDto>.ErrorResponse("Error fetching activity analytics"));
        }
    }

    [HttpGet("geographic-analytics")]
    public async Task<ActionResult<ApiResponse<GeographicAnalyticsDto>>> GetGeographicAnalyticsEndpoint()
    {
        try
        {
            var analytics = await GetGeographicAnalytics();
            return Ok(ApiResponse<GeographicAnalyticsDto>.SuccessResponse(analytics));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching geographic analytics: {ex.Message}");
            return StatusCode(500, ApiResponse<GeographicAnalyticsDto>.ErrorResponse("Error fetching geographic analytics"));
        }
    }

    [HttpGet("time-based-analytics")]
    public async Task<ActionResult<ApiResponse<TimeBasedAnalyticsDto>>> GetTimeBasedAnalyticsEndpoint()
    {
        try
        {
            var analytics = await GetTimeBasedAnalytics();
            return Ok(ApiResponse<TimeBasedAnalyticsDto>.SuccessResponse(analytics));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching time-based analytics: {ex.Message}");
            return StatusCode(500, ApiResponse<TimeBasedAnalyticsDto>.ErrorResponse("Error fetching time-based analytics"));
        }
    }

    [HttpGet("financial-health")]
    public async Task<ActionResult<ApiResponse<FinancialHealthDto>>> GetFinancialHealthEndpoint()
    {
        try
        {
            var health = await GetFinancialHealth();
            return Ok(ApiResponse<FinancialHealthDto>.SuccessResponse(health));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching financial health: {ex.Message}");
            return StatusCode(500, ApiResponse<FinancialHealthDto>.ErrorResponse("Error fetching financial health"));
        }
    }

    [HttpGet("alerts")]
    public async Task<ActionResult<ApiResponse<DashboardAlertsDto>>> GetDashboardAlertsEndpoint()
    {
        try
        {
            var alerts = await GetDashboardAlerts();
            return Ok(ApiResponse<DashboardAlertsDto>.SuccessResponse(alerts));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching dashboard alerts: {ex.Message}");
            return StatusCode(500, ApiResponse<DashboardAlertsDto>.ErrorResponse("Error fetching dashboard alerts"));
        }
    }

    #region Private Methods

    // Helper to create UTC DateTime for PostgreSQL compatibility
    private static DateTime ToUtc(int year, int month, int day)
    {
        return DateTime.SpecifyKind(new DateTime(year, month, day), DateTimeKind.Utc);
    }

    private async Task<RevenueAnalyticsDto> GetRevenueAnalytics()
    {
        var now = DateTime.UtcNow;
        var thisMonthStart = ToUtc(now.Year, now.Month, 1);
        var lastMonthStart = thisMonthStart.AddMonths(-1);
        var lastMonthEnd = thisMonthStart.AddDays(-1);
        var thisQuarterStart = ToUtc(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1);
        var thisYearStart = ToUtc(now.Year, 1, 1);
        var lastYearStart = ToUtc(now.Year - 1, 1, 1);
        var lastYearEnd = thisYearStart.AddDays(-1);

        var confirmedOrders = _context.Orders
            .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived);

        var analytics = new RevenueAnalyticsDto
        {
            TotalRevenue = await confirmedOrders.SumAsync(o => o.TotalAmount),
            RevenueThisMonth = await confirmedOrders
                .Where(o => o.OrderDate >= thisMonthStart)
                .SumAsync(o => o.TotalAmount),
            RevenueLastMonth = await confirmedOrders
                .Where(o => o.OrderDate >= lastMonthStart && o.OrderDate <= lastMonthEnd)
                .SumAsync(o => o.TotalAmount),
            RevenueThisQuarter = await confirmedOrders
                .Where(o => o.OrderDate >= thisQuarterStart)
                .SumAsync(o => o.TotalAmount),
            RevenueThisYear = await confirmedOrders
                .Where(o => o.OrderDate >= thisYearStart)
                .SumAsync(o => o.TotalAmount)
        };

        var orderCount = await confirmedOrders.CountAsync();
        analytics.AverageOrderValue = orderCount > 0 ? analytics.TotalRevenue / orderCount : 0;

        var activeSubscriptions = await _context.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active)
            .ToListAsync();
        analytics.MonthlyRecurringRevenue = activeSubscriptions.Sum(s => s.AnnualFee / 12);
        analytics.AnnualRecurringRevenue = activeSubscriptions.Sum(s => s.AnnualFee);

        analytics.PendingRevenue = await _context.Orders
            .Where(o => o.Status == OrderStatus.Pending)
            .SumAsync(o => o.TotalAmount);

        if (analytics.RevenueLastMonth > 0)
        {
            analytics.RevenueGrowthMoM = ((analytics.RevenueThisMonth - analytics.RevenueLastMonth) / analytics.RevenueLastMonth) * 100;
        }

        var lastYearRevenue = await confirmedOrders
            .Where(o => o.OrderDate >= lastYearStart && o.OrderDate <= lastYearEnd)
            .SumAsync(o => o.TotalAmount);
        if (lastYearRevenue > 0)
        {
            analytics.RevenueGrowthYoY = ((analytics.RevenueThisYear - lastYearRevenue) / lastYearRevenue) * 100;
        }

        var upcomingRenewals30 = await _context.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active && s.RenewalDate <= now.AddDays(30))
            .SumAsync(s => s.AnnualFee);
        var upcomingRenewals90 = await _context.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active && s.RenewalDate <= now.AddDays(90))
            .SumAsync(s => s.AnnualFee);
        analytics.ProjectedRevenue30Days = analytics.PendingRevenue + upcomingRenewals30;
        analytics.ProjectedRevenue90Days = analytics.PendingRevenue + upcomingRenewals90;

        var last12Months = Enumerable.Range(0, 12)
            .Select(i => thisMonthStart.AddMonths(-i))
            .OrderBy(d => d)
            .ToList();

        var monthlyData = new List<MonthlyRevenueDto>();
        decimal previousRevenue = 0;
        foreach (var month in last12Months)
        {
            var monthEnd = month.AddMonths(1).AddDays(-1);
            var revenue = await confirmedOrders
                .Where(o => o.OrderDate >= month && o.OrderDate <= monthEnd)
                .SumAsync(o => o.TotalAmount);
            var count = await confirmedOrders
                .Where(o => o.OrderDate >= month && o.OrderDate <= monthEnd)
                .CountAsync();

            var growth = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;

            monthlyData.Add(new MonthlyRevenueDto
            {
                Year = month.Year,
                Month = month.Month,
                MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(month.Month),
                Revenue = revenue,
                OrderCount = count,
                GrowthPercent = growth
            });
            previousRevenue = revenue;
        }
        analytics.MonthlyRevenue = monthlyData;

        var totalOrderAmount = await _context.Orders
            .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
            .SumAsync(o => o.TotalAmount);

        analytics.PaymentBreakdown = new List<PaymentStatusBreakdownDto>
        {
            new() {
                Status = "Paid",
                Count = await _context.Orders.CountAsync(o => o.PaymentStatus == PaymentStatus.Paid && (o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)),
                Amount = await _context.Orders.Where(o => o.PaymentStatus == PaymentStatus.Paid && (o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)).SumAsync(o => o.TotalAmount),
                Percentage = totalOrderAmount > 0 ? (await _context.Orders.Where(o => o.PaymentStatus == PaymentStatus.Paid).SumAsync(o => o.TotalAmount) / totalOrderAmount) * 100 : 0
            },
            new() {
                Status = "Partial",
                Count = await _context.Orders.CountAsync(o => o.PaymentStatus == PaymentStatus.Partial),
                Amount = await _context.Orders.Where(o => o.PaymentStatus == PaymentStatus.Partial).SumAsync(o => o.TotalAmount),
                Percentage = totalOrderAmount > 0 ? (await _context.Orders.Where(o => o.PaymentStatus == PaymentStatus.Partial).SumAsync(o => o.TotalAmount) / totalOrderAmount) * 100 : 0
            },
            new() {
                Status = "Pending",
                Count = await _context.Orders.CountAsync(o => o.PaymentStatus == PaymentStatus.Pending),
                Amount = await _context.Orders.Where(o => o.PaymentStatus == PaymentStatus.Pending).SumAsync(o => o.TotalAmount),
                Percentage = totalOrderAmount > 0 ? (await _context.Orders.Where(o => o.PaymentStatus == PaymentStatus.Pending).SumAsync(o => o.TotalAmount) / totalOrderAmount) * 100 : 0
            }
        };

        return analytics;
    }

    private async Task<CustomerAnalyticsDto> GetCustomerAnalytics()
    {
        var now = DateTime.UtcNow;
        var thisMonthStart = ToUtc(now.Year, now.Month, 1);
        var thisYearStart = ToUtc(now.Year, 1, 1);
        var sixMonthsAgo = now.AddMonths(-6);

        var analytics = new CustomerAnalyticsDto
        {
            TotalCustomers = await _context.Customers.CountAsync(),
            NewCustomersThisMonth = await _context.Customers.CountAsync(c => c.CreatedAt >= thisMonthStart),
            NewCustomersThisYear = await _context.Customers.CountAsync(c => c.CreatedAt >= thisYearStart)
        };

        var customersWithActiveSubscriptions = await _context.Customers
            .Where(c => c.Subscriptions.Any(s => s.Status == SubscriptionStatus.Active))
            .Select(c => c.CustomerId)
            .ToListAsync();
        analytics.ActiveCustomers = customersWithActiveSubscriptions.Count;

        var customersWithRecentOrders = await _context.Orders
            .Where(o => o.OrderDate >= sixMonthsAgo)
            .Select(o => o.CustomerId)
            .Distinct()
            .ToListAsync();
        analytics.DormantCustomers = analytics.TotalCustomers - customersWithRecentOrders.Count;

        var customerRevenue = await _context.Orders
            .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
            .GroupBy(o => o.CustomerId)
            .Select(g => new { CustomerId = g.Key, TotalRevenue = g.Sum(o => o.TotalAmount) })
            .ToListAsync();

        if (customerRevenue.Any())
        {
            analytics.AverageCustomerLifetimeValue = customerRevenue.Average(c => c.TotalRevenue);
            var sorted = customerRevenue.OrderBy(c => c.TotalRevenue).ToList();
            analytics.MedianCustomerLifetimeValue = sorted.Count % 2 == 0
                ? (sorted[sorted.Count / 2 - 1].TotalRevenue + sorted[sorted.Count / 2].TotalRevenue) / 2
                : sorted[sorted.Count / 2].TotalRevenue;
        }

        var totalSubscriptions = await _context.Subscriptions.CountAsync();
        var renewedSubscriptions = await _context.Subscriptions.CountAsync(s => s.RenewalCount > 0);
        analytics.CustomerRetentionRate = totalSubscriptions > 0 ? ((decimal)renewedSubscriptions / totalSubscriptions) * 100 : 0;

        var cancelledSubscriptions = await _context.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Cancelled);
        analytics.ChurnRate = totalSubscriptions > 0 ? ((decimal)cancelledSubscriptions / totalSubscriptions) * 100 : 0;

        var customersWithMultipleOrders = await _context.Orders
            .GroupBy(o => o.CustomerId)
            .Where(g => g.Count() > 1)
            .CountAsync();
        analytics.RepeatPurchaseRate = analytics.TotalCustomers > 0 ? ((decimal)customersWithMultipleOrders / analytics.TotalCustomers) * 100 : 0;

        var customerAges = await _context.Customers
            .Select(c => (now - c.CreatedAt).TotalDays / 30)
            .ToListAsync();
        analytics.AverageCustomerAgeMonths = customerAges.Any() ? customerAges.Average() : 0;

        analytics.TopCustomersByRevenue = await _context.Customers
            .Select(c => new TopCustomerDto
            {
                CustomerId = c.CustomerId,
                CompanyName = c.CompanyName,
                Industry = c.Industry ?? "N/A",
                TotalRevenue = c.Orders
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
                    .Sum(o => o.TotalAmount),
                TotalOrders = c.Orders.Count,
                ActiveSubscriptions = c.Subscriptions.Count(s => s.Status == SubscriptionStatus.Active),
                CustomerSince = c.CreatedAt.ToString("MMM yyyy"),
                HealthScore = c.Subscriptions.Any(s => s.Status == SubscriptionStatus.Active) ? "Healthy" :
                             c.Subscriptions.Any(s => s.Status == SubscriptionStatus.Expired) ? "At Risk" : "New"
            })
            .OrderByDescending(c => c.TotalRevenue)
            .Take(10)
            .ToListAsync();

        var totalRevenue = customerRevenue.Sum(c => c.TotalRevenue);
        var platinum = customerRevenue.Where(c => c.TotalRevenue >= 100000).ToList();
        var gold = customerRevenue.Where(c => c.TotalRevenue >= 50000 && c.TotalRevenue < 100000).ToList();
        var silver = customerRevenue.Where(c => c.TotalRevenue >= 10000 && c.TotalRevenue < 50000).ToList();
        var bronze = customerRevenue.Where(c => c.TotalRevenue < 10000).ToList();

        analytics.CustomerSegments = new List<CustomerSegmentDto>
        {
            new() { Segment = "Platinum (₹1L+)", Count = platinum.Count, TotalRevenue = platinum.Sum(c => c.TotalRevenue), AverageRevenue = platinum.Any() ? platinum.Average(c => c.TotalRevenue) : 0, Percentage = analytics.TotalCustomers > 0 ? ((decimal)platinum.Count / analytics.TotalCustomers) * 100 : 0 },
            new() { Segment = "Gold (₹50K-1L)", Count = gold.Count, TotalRevenue = gold.Sum(c => c.TotalRevenue), AverageRevenue = gold.Any() ? gold.Average(c => c.TotalRevenue) : 0, Percentage = analytics.TotalCustomers > 0 ? ((decimal)gold.Count / analytics.TotalCustomers) * 100 : 0 },
            new() { Segment = "Silver (₹10K-50K)", Count = silver.Count, TotalRevenue = silver.Sum(c => c.TotalRevenue), AverageRevenue = silver.Any() ? silver.Average(c => c.TotalRevenue) : 0, Percentage = analytics.TotalCustomers > 0 ? ((decimal)silver.Count / analytics.TotalCustomers) * 100 : 0 },
            new() { Segment = "Bronze (<₹10K)", Count = bronze.Count, TotalRevenue = bronze.Sum(c => c.TotalRevenue), AverageRevenue = bronze.Any() ? bronze.Average(c => c.TotalRevenue) : 0, Percentage = analytics.TotalCustomers > 0 ? ((decimal)bronze.Count / analytics.TotalCustomers) * 100 : 0 }
        };

        analytics.IndustryBreakdown = await _context.Customers
            .GroupBy(c => c.Industry ?? "Unknown")
            .Select(g => new IndustryBreakdownDto
            {
                Industry = g.Key,
                CustomerCount = g.Count(),
                TotalRevenue = g.SelectMany(c => c.Orders)
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
                    .Sum(o => o.TotalAmount),
                AverageOrderValue = g.SelectMany(c => c.Orders)
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
                    .Average(o => (decimal?)o.TotalAmount) ?? 0
            })
            .OrderByDescending(i => i.TotalRevenue)
            .Take(10)
            .ToListAsync();

        return analytics;
    }

    private async Task<SalesPipelineDto> GetSalesPipeline()
    {
        var pipeline = new SalesPipelineDto();

        var leads = await _context.Leads.ToListAsync();
        var convertedLeads = leads.Where(l => l.Status == LeadStatus.Converted).ToList();

        pipeline.TotalLeadsInPipeline = leads.Count(l => l.Status == LeadStatus.New || l.Status == LeadStatus.Demo);
        pipeline.TotalPipelineValue = leads
            .Where(l => l.Status == LeadStatus.New || l.Status == LeadStatus.Demo)
            .Sum(l => l.EstimatedValue ?? 0);

        pipeline.AverageDealSize = convertedLeads.Any()
            ? convertedLeads.Average(l => l.EstimatedValue ?? 0)
            : 0;

        var salesCycles = convertedLeads
            .Where(l => l.ConvertedDate.HasValue)
            .Select(l => (l.ConvertedDate!.Value - l.CreatedAt).TotalDays)
            .ToList();
        pipeline.AverageSalesCycleDays = salesCycles.Any() ? salesCycles.Average() : 0;

        var totalLeads = leads.Count;
        pipeline.WinRate = totalLeads > 0 ? ((decimal)convertedLeads.Count / totalLeads) * 100 : 0;
        pipeline.LossRate = totalLeads > 0 ? ((decimal)leads.Count(l => l.Status == LeadStatus.Lost) / totalLeads) * 100 : 0;

        var demoLeads = leads.Where(l => l.Status == LeadStatus.Demo || l.Status == LeadStatus.Converted).ToList();
        var demoConverted = leads.Where(l => l.Status == LeadStatus.Converted).ToList();
        pipeline.DemoToConversionRate = demoLeads.Any() ? ((decimal)demoConverted.Count / demoLeads.Count) * 100 : 0;

        pipeline.PipelineStages = new List<PipelineStageDto>
        {
            new() {
                Stage = "New",
                Count = leads.Count(l => l.Status == LeadStatus.New),
                Value = leads.Where(l => l.Status == LeadStatus.New).Sum(l => l.EstimatedValue ?? 0),
                ConversionToNext = leads.Count(l => l.Status == LeadStatus.New) > 0
                    ? ((decimal)leads.Count(l => l.Status != LeadStatus.New) / leads.Count(l => l.Status == LeadStatus.New || l.Status == LeadStatus.Demo || l.Status == LeadStatus.Converted)) * 100
                    : 0
            },
            new() {
                Stage = "Demo",
                Count = leads.Count(l => l.Status == LeadStatus.Demo),
                Value = leads.Where(l => l.Status == LeadStatus.Demo).Sum(l => l.EstimatedValue ?? 0),
                ConversionToNext = pipeline.DemoToConversionRate
            },
            new() {
                Stage = "Converted",
                Count = convertedLeads.Count,
                Value = convertedLeads.Sum(l => l.EstimatedValue ?? 0)
            },
            new() {
                Stage = "Lost",
                Count = leads.Count(l => l.Status == LeadStatus.Lost),
                Value = leads.Where(l => l.Status == LeadStatus.Lost).Sum(l => l.EstimatedValue ?? 0)
            }
        };

        var leadsBySource = leads.GroupBy(l => l.LeadSource?.ToString() ?? "Unknown").ToList();
        pipeline.LeadSourcePerformance = leadsBySource.Select(g =>
        {
            var converted = g.Where(l => l.Status == LeadStatus.Converted).ToList();
            var cycles = converted
                .Where(l => l.ConvertedDate.HasValue)
                .Select(l => (l.ConvertedDate!.Value - l.CreatedAt).TotalDays)
                .ToList();

            return new LeadSourcePerformanceDto
            {
                Source = g.Key,
                LeadCount = g.Count(),
                ConvertedCount = converted.Count,
                ConversionRate = g.Count() > 0 ? ((decimal)converted.Count / g.Count()) * 100 : 0,
                TotalRevenue = converted.Sum(l => l.EstimatedValue ?? 0),
                AverageDealSize = converted.Any() ? converted.Average(l => l.EstimatedValue ?? 0) : 0,
                AverageSalesCycleDays = cycles.Any() ? cycles.Average() : 0
            };
        }).OrderByDescending(s => s.TotalRevenue).ToList();

        var leadsByRating = leads.Where(l => l.Rating.HasValue).GroupBy(l => l.Rating!.Value.ToString()).ToList();
        pipeline.LeadRatingPerformance = leadsByRating.Select(g =>
        {
            var converted = g.Where(l => l.Status == LeadStatus.Converted).ToList();
            return new LeadRatingPerformanceDto
            {
                Rating = g.Key,
                Count = g.Count(),
                ConvertedCount = converted.Count,
                ConversionRate = g.Count() > 0 ? ((decimal)converted.Count / g.Count()) * 100 : 0,
                AverageValue = g.Average(l => l.EstimatedValue ?? 0)
            };
        }).ToList();

        var lostLeads = leads.Where(l => l.Status == LeadStatus.Lost && !string.IsNullOrEmpty(l.LostReason)).ToList();
        var totalLost = lostLeads.Count;
        pipeline.LostReasonAnalysis = lostLeads
            .GroupBy(l => l.LostReason ?? "Unknown")
            .Select(g => new LostReasonAnalysisDto
            {
                Reason = g.Key,
                Count = g.Count(),
                LostValue = g.Sum(l => l.EstimatedValue ?? 0),
                Percentage = totalLost > 0 ? ((decimal)g.Count() / totalLost) * 100 : 0
            })
            .OrderByDescending(r => r.Count)
            .Take(10)
            .ToList();

        return pipeline;
    }

    private async Task<ProductAnalyticsDto> GetProductAnalytics()
    {
        var analytics = new ProductAnalyticsDto
        {
            TotalProducts = await _context.ProductVariants.CountAsync(),
            ActiveProducts = await _context.ProductVariants.CountAsync(p => p.IsActive)
        };

        var totalRevenue = await _context.Orders
            .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
            .SumAsync(o => o.TotalAmount);

        analytics.ProductPerformance = await _context.ProductVariants
            .Select(p => new ProductPerformanceDto
            {
                VariantId = p.VariantId,
                VariantName = p.VariantName,
                VariantCode = p.VariantCode,
                TotalOrders = p.Orders.Count(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived),
                ActiveSubscriptions = p.Subscriptions.Count(s => s.Status == SubscriptionStatus.Active),
                TotalRevenue = p.Orders
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
                    .Sum(o => o.TotalAmount),
                AverageOrderValue = p.Orders
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
                    .Average(o => (decimal?)o.TotalAmount) ?? 0,
                MarketShare = totalRevenue > 0
                    ? (p.Orders.Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived).Sum(o => o.TotalAmount) / totalRevenue) * 100
                    : 0
            })
            .OrderByDescending(p => p.TotalRevenue)
            .ToListAsync();

        var ordersByLicense = await _context.Orders
            .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
            .GroupBy(o => o.UserLicenseType)
            .Select(g => new { LicenseType = g.Key, Count = g.Count(), Revenue = g.Sum(o => o.TotalAmount) })
            .ToListAsync();

        var totalOrders = ordersByLicense.Sum(o => o.Count);
        analytics.LicenseTypeDistribution = ordersByLicense.Select(o => new LicenseTypeDistributionDto
        {
            LicenseType = o.LicenseType.ToString(),
            Count = o.Count,
            Revenue = o.Revenue,
            Percentage = totalOrders > 0 ? ((decimal)o.Count / totalOrders) * 100 : 0
        }).ToList();

        analytics.TotalCustomizationRevenue = await _context.Orders
            .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
            .SumAsync(o => o.CustomizationAmount);

        var ordersWithDiscount = await _context.Orders
            .Where(o => o.DiscountPercent > 0)
            .ToListAsync();
        analytics.AverageDiscountPercent = ordersWithDiscount.Any() ? ordersWithDiscount.Average(o => o.DiscountPercent) : 0;
        analytics.TotalDiscountGiven = ordersWithDiscount.Sum(o => o.DiscountAmount);

        return analytics;
    }

    private async Task<PartnerPerformanceDto> GetPartnerPerformance()
    {
        var partners = await _context.Users
            .Where(u => u.Role == UserRole.Partner)
            .ToListAsync();

        var performance = new PartnerPerformanceDto
        {
            TotalPartners = partners.Count,
            ActivePartners = partners.Count(p => p.IsActive)
        };

        var partnerLeaderboard = new List<PartnerLeaderboardDto>();
        foreach (var partner in partners)
        {
            var leads = await _context.Leads.Where(l => l.CreatedBy == partner.UserId).ToListAsync();
            var orders = await _context.Orders
                .Where(o => o.CreatedBy == partner.UserId && (o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived))
                .ToListAsync();

            var leaderboardEntry = new PartnerLeaderboardDto
            {
                UserId = partner.UserId,
                Name = partner.Name,
                Email = partner.Email,
                LeadsCreated = leads.Count,
                LeadsConverted = leads.Count(l => l.Status == LeadStatus.Converted),
                TotalOrders = orders.Count,
                TotalRevenue = orders.Sum(o => o.TotalAmount),
                TotalCommission = orders.Sum(o => o.TotalAmount) * CommissionRate / 100
            };
            leaderboardEntry.ConversionRate = leaderboardEntry.LeadsCreated > 0
                ? ((decimal)leaderboardEntry.LeadsConverted / leaderboardEntry.LeadsCreated) * 100
                : 0;

            partnerLeaderboard.Add(leaderboardEntry);
        }

        performance.TopPartners = partnerLeaderboard
            .OrderByDescending(p => p.TotalRevenue)
            .Select((p, i) => { p.Rank = i + 1; return p; })
            .Take(10)
            .ToList();

        performance.TotalPartnerRevenue = partnerLeaderboard.Sum(p => p.TotalRevenue);
        performance.TotalCommissionsPaid = partnerLeaderboard.Sum(p => p.TotalCommission);

        var thisMonthStart = ToUtc(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        performance.PartnerActivity = new List<PartnerActivityDto>();
        foreach (var partner in partners.Take(20))
        {
            var leadsThisMonth = await _context.Leads
                .CountAsync(l => l.CreatedBy == partner.UserId && l.CreatedAt >= thisMonthStart);
            var ordersThisMonth = await _context.Orders
                .Where(o => o.CreatedBy == partner.UserId && o.OrderDate >= thisMonthStart)
                .ToListAsync();
            var lastActivity = await _context.Activities
                .Where(a => a.CreatedBy == partner.UserId)
                .OrderByDescending(a => a.ActivityDate)
                .FirstOrDefaultAsync();

            performance.PartnerActivity.Add(new PartnerActivityDto
            {
                UserId = partner.UserId,
                Name = partner.Name,
                LeadsThisMonth = leadsThisMonth,
                OrdersThisMonth = ordersThisMonth.Count,
                RevenueThisMonth = ordersThisMonth.Sum(o => o.TotalAmount),
                LastActivityDate = lastActivity?.ActivityDate,
                ActivityLevel = leadsThisMonth >= 5 || ordersThisMonth.Count >= 2 ? "High" :
                               leadsThisMonth >= 2 || ordersThisMonth.Count >= 1 ? "Medium" : "Low"
            });
        }

        var last12Months = Enumerable.Range(0, 12)
            .Select(i => ToUtc(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-i))
            .OrderBy(d => d)
            .ToList();

        performance.MonthlyPartnerRevenue = new List<MonthlyPartnerRevenueDto>();
        foreach (var month in last12Months)
        {
            var monthEnd = month.AddMonths(1).AddDays(-1);
            var monthlyOrders = await _context.Orders
                .Where(o => o.OrderDate >= month && o.OrderDate <= monthEnd &&
                           (o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived) &&
                           o.CreatedByUser != null && o.CreatedByUser.Role == UserRole.Partner)
                .ToListAsync();

            performance.MonthlyPartnerRevenue.Add(new MonthlyPartnerRevenueDto
            {
                Month = month.Month,
                MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(month.Month),
                Year = month.Year,
                TotalRevenue = monthlyOrders.Sum(o => o.TotalAmount),
                TotalCommission = monthlyOrders.Sum(o => o.TotalAmount) * CommissionRate / 100,
                OrderCount = monthlyOrders.Count
            });
        }

        return performance;
    }

    private async Task<SubscriptionAnalyticsDto> GetSubscriptionAnalytics()
    {
        var subscriptions = await _context.Subscriptions.ToListAsync();
        var now = DateTime.UtcNow;

        var analytics = new SubscriptionAnalyticsDto
        {
            TotalSubscriptions = subscriptions.Count,
            ActiveSubscriptions = subscriptions.Count(s => s.Status == SubscriptionStatus.Active),
            ExpiredSubscriptions = subscriptions.Count(s => s.Status == SubscriptionStatus.Expired),
            CancelledSubscriptions = subscriptions.Count(s => s.Status == SubscriptionStatus.Cancelled),
            SuspendedSubscriptions = subscriptions.Count(s => s.Status == SubscriptionStatus.Suspended),
            PendingRenewalSubscriptions = subscriptions.Count(s => s.Status == SubscriptionStatus.PendingRenewal),
            AutoRenewEnabled = subscriptions.Count(s => s.AutoRenew),
            AutoRenewDisabled = subscriptions.Count(s => !s.AutoRenew),
            TotalSubscriptionRevenue = subscriptions.Sum(s => s.AnnualFee),
            AverageAnnualFee = subscriptions.Any() ? subscriptions.Average(s => s.AnnualFee) : 0
        };

        var renewedSubscriptions = subscriptions.Count(s => s.RenewalCount > 0);
        analytics.SubscriptionRenewalRate = subscriptions.Count > 0
            ? ((decimal)renewedSubscriptions / subscriptions.Count) * 100
            : 0;

        var durations = subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active || s.Status == SubscriptionStatus.Expired)
            .Select(s => (s.CurrentPeriodEnd - s.StartDate).TotalDays / 365)
            .ToList();
        analytics.AverageSubscriptionDuration = durations.Any() ? durations.Average() : 0;

        analytics.ChurnRate = subscriptions.Count > 0
            ? ((decimal)analytics.CancelledSubscriptions / subscriptions.Count) * 100
            : 0;

        var totalSubs = (decimal)subscriptions.Count;
        analytics.StatusBreakdown = new List<SubscriptionStatusBreakdownDto>
        {
            new() { Status = "Active", Count = analytics.ActiveSubscriptions, Revenue = subscriptions.Where(s => s.Status == SubscriptionStatus.Active).Sum(s => s.AnnualFee), Percentage = totalSubs > 0 ? (analytics.ActiveSubscriptions / totalSubs) * 100 : 0 },
            new() { Status = "Expired", Count = analytics.ExpiredSubscriptions, Revenue = subscriptions.Where(s => s.Status == SubscriptionStatus.Expired).Sum(s => s.AnnualFee), Percentage = totalSubs > 0 ? (analytics.ExpiredSubscriptions / totalSubs) * 100 : 0 },
            new() { Status = "Cancelled", Count = analytics.CancelledSubscriptions, Revenue = subscriptions.Where(s => s.Status == SubscriptionStatus.Cancelled).Sum(s => s.AnnualFee), Percentage = totalSubs > 0 ? (analytics.CancelledSubscriptions / totalSubs) * 100 : 0 },
            new() { Status = "Suspended", Count = analytics.SuspendedSubscriptions, Revenue = subscriptions.Where(s => s.Status == SubscriptionStatus.Suspended).Sum(s => s.AnnualFee), Percentage = totalSubs > 0 ? (analytics.SuspendedSubscriptions / totalSubs) * 100 : 0 },
            new() { Status = "Pending Renewal", Count = analytics.PendingRenewalSubscriptions, Revenue = subscriptions.Where(s => s.Status == SubscriptionStatus.PendingRenewal).Sum(s => s.AnnualFee), Percentage = totalSubs > 0 ? (analytics.PendingRenewalSubscriptions / totalSubs) * 100 : 0 }
        };

        var activeSubscriptions = subscriptions.Where(s => s.Status == SubscriptionStatus.Active).ToList();
        analytics.RenewalForecast = new List<RenewalForecastDto>
        {
            new() {
                Period = "Next 7 Days",
                DaysFromNow = 7,
                SubscriptionCount = activeSubscriptions.Count(s => s.RenewalDate <= now.AddDays(7)),
                ExpectedRevenue = activeSubscriptions.Where(s => s.RenewalDate <= now.AddDays(7)).Sum(s => s.AnnualFee),
                AtRiskCount = activeSubscriptions.Count(s => s.RenewalDate <= now.AddDays(7) && !s.AutoRenew)
            },
            new() {
                Period = "Next 30 Days",
                DaysFromNow = 30,
                SubscriptionCount = activeSubscriptions.Count(s => s.RenewalDate <= now.AddDays(30)),
                ExpectedRevenue = activeSubscriptions.Where(s => s.RenewalDate <= now.AddDays(30)).Sum(s => s.AnnualFee),
                AtRiskCount = activeSubscriptions.Count(s => s.RenewalDate <= now.AddDays(30) && !s.AutoRenew)
            },
            new() {
                Period = "Next 60 Days",
                DaysFromNow = 60,
                SubscriptionCount = activeSubscriptions.Count(s => s.RenewalDate <= now.AddDays(60)),
                ExpectedRevenue = activeSubscriptions.Where(s => s.RenewalDate <= now.AddDays(60)).Sum(s => s.AnnualFee),
                AtRiskCount = activeSubscriptions.Count(s => s.RenewalDate <= now.AddDays(60) && !s.AutoRenew)
            },
            new() {
                Period = "Next 90 Days",
                DaysFromNow = 90,
                SubscriptionCount = activeSubscriptions.Count(s => s.RenewalDate <= now.AddDays(90)),
                ExpectedRevenue = activeSubscriptions.Where(s => s.RenewalDate <= now.AddDays(90)).Sum(s => s.AnnualFee),
                AtRiskCount = activeSubscriptions.Count(s => s.RenewalDate <= now.AddDays(90) && !s.AutoRenew)
            }
        };

        var cancelledWithReason = subscriptions.Where(s => s.Status == SubscriptionStatus.Cancelled && !string.IsNullOrEmpty(s.CancellationReason)).ToList();
        var totalCancelled = cancelledWithReason.Count;
        analytics.CancellationReasons = cancelledWithReason
            .GroupBy(s => s.CancellationReason!)
            .Select(g => new CancellationReasonDto
            {
                Reason = g.Key,
                Count = g.Count(),
                LostRevenue = g.Sum(s => s.AnnualFee),
                Percentage = totalCancelled > 0 ? ((decimal)g.Count() / totalCancelled) * 100 : 0
            })
            .OrderByDescending(r => r.Count)
            .Take(10)
            .ToList();

        var suspendedWithReason = subscriptions.Where(s => s.Status == SubscriptionStatus.Suspended && !string.IsNullOrEmpty(s.SuspensionReason)).ToList();
        var totalSuspended = suspendedWithReason.Count;
        analytics.SuspensionReasons = suspendedWithReason
            .GroupBy(s => s.SuspensionReason!)
            .Select(g => new SuspensionReasonDto
            {
                Reason = g.Key,
                Count = g.Count(),
                Percentage = totalSuspended > 0 ? ((decimal)g.Count() / totalSuspended) * 100 : 0
            })
            .OrderByDescending(r => r.Count)
            .Take(10)
            .ToList();

        analytics.RenewalDistribution = subscriptions
            .GroupBy(s => s.RenewalCount)
            .Select(g => new RenewalDistributionDto
            {
                RenewalCount = g.Key,
                SubscriptionCount = g.Count(),
                Percentage = subscriptions.Count > 0 ? ((decimal)g.Count() / subscriptions.Count) * 100 : 0
            })
            .OrderBy(r => r.RenewalCount)
            .ToList();

        return analytics;
    }

    private async Task<ActivityAnalyticsDto> GetActivityAnalytics()
    {
        var activities = await _context.Activities.ToListAsync();
        var now = DateTime.UtcNow;

        var analytics = new ActivityAnalyticsDto
        {
            TotalActivities = activities.Count,
            CompletedActivities = activities.Count(a => a.Status == ActivityStatus.Completed),
            PendingActivities = activities.Count(a => a.Status == ActivityStatus.Planned || a.Status == ActivityStatus.InProgress),
            OverdueActivities = activities.Count(a => a.DueDate.HasValue && a.DueDate < now && a.Status != ActivityStatus.Completed && a.Status != ActivityStatus.Cancelled)
        };

        analytics.CompletionRate = analytics.TotalActivities > 0
            ? ((decimal)analytics.CompletedActivities / analytics.TotalActivities) * 100
            : 0;

        var leadCount = await _context.Leads.CountAsync();
        var customerCount = await _context.Customers.CountAsync();
        analytics.AverageActivitiesPerLead = leadCount > 0
            ? (double)activities.Count(a => a.RelatedToType == RelatedToType.Lead) / leadCount
            : 0;
        analytics.AverageActivitiesPerCustomer = customerCount > 0
            ? (double)activities.Count(a => a.RelatedToType == RelatedToType.Customer) / customerCount
            : 0;

        analytics.ActivityTypeBreakdown = activities
            .GroupBy(a => a.ActivityType.ToString())
            .Select(g => new ActivityTypeBreakdownDto
            {
                Type = g.Key,
                Count = g.Count(),
                Completed = g.Count(a => a.Status == ActivityStatus.Completed),
                CompletionRate = g.Count() > 0 ? ((decimal)g.Count(a => a.Status == ActivityStatus.Completed) / g.Count()) * 100 : 0,
                AverageDuration = g.Where(a => a.Duration.HasValue).Average(a => (double?)a.Duration) ?? 0
            })
            .ToList();

        var last8Weeks = Enumerable.Range(0, 8)
            .Select(i => now.AddDays(-i * 7).Date)
            .OrderBy(d => d)
            .ToList();

        analytics.WeeklyTrend = last8Weeks.Select(weekStart =>
        {
            var weekEnd = weekStart.AddDays(7);
            var weekActivities = activities.Where(a => a.ActivityDate >= weekStart && a.ActivityDate < weekEnd).ToList();
            return new ActivityTrendDto
            {
                Period = $"Week of {weekStart:MMM dd}",
                Planned = weekActivities.Count(a => a.Status == ActivityStatus.Planned),
                Completed = weekActivities.Count(a => a.Status == ActivityStatus.Completed),
                Cancelled = weekActivities.Count(a => a.Status == ActivityStatus.Cancelled)
            };
        }).ToList();

        var userActivities = activities.GroupBy(a => a.CreatedBy).ToList();
        analytics.UserProductivity = new List<UserProductivityDto>();
        foreach (var group in userActivities.Take(10))
        {
            var user = await _context.Users.FindAsync(group.Key);
            if (user != null)
            {
                analytics.UserProductivity.Add(new UserProductivityDto
                {
                    UserId = user.UserId,
                    UserName = user.Name,
                    TotalActivities = group.Count(),
                    CompletedActivities = group.Count(a => a.Status == ActivityStatus.Completed),
                    CompletionRate = group.Count() > 0 ? ((decimal)group.Count(a => a.Status == ActivityStatus.Completed) / group.Count()) * 100 : 0
                });
            }
        }

        return analytics;
    }

    private async Task<GeographicAnalyticsDto> GetGeographicAnalytics()
    {
        var analytics = new GeographicAnalyticsDto();

        analytics.RevenueByState = await _context.Customers
            .Where(c => !string.IsNullOrEmpty(c.BillingState))
            .GroupBy(c => c.BillingState!)
            .Select(g => new StateRevenueDto
            {
                State = g.Key,
                CustomerCount = g.Count(),
                TotalRevenue = g.SelectMany(c => c.Orders)
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
                    .Sum(o => o.TotalAmount),
                OrderCount = g.SelectMany(c => c.Orders).Count(),
                AverageOrderValue = g.SelectMany(c => c.Orders)
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
                    .Average(o => (decimal?)o.TotalAmount) ?? 0
            })
            .OrderByDescending(s => s.TotalRevenue)
            .Take(15)
            .ToListAsync();

        analytics.RevenueByCountry = await _context.Customers
            .Where(c => !string.IsNullOrEmpty(c.BillingCountry))
            .GroupBy(c => c.BillingCountry!)
            .Select(g => new CountryRevenueDto
            {
                Country = g.Key,
                CustomerCount = g.Count(),
                TotalRevenue = g.SelectMany(c => c.Orders)
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
                    .Sum(o => o.TotalAmount)
            })
            .OrderByDescending(c => c.TotalRevenue)
            .ToListAsync();

        analytics.TopCities = await _context.Customers
            .Where(c => !string.IsNullOrEmpty(c.BillingCity))
            .GroupBy(c => new { c.BillingCity, c.BillingState })
            .Select(g => new CityRevenueDto
            {
                City = g.Key.BillingCity!,
                State = g.Key.BillingState ?? "",
                CustomerCount = g.Count(),
                TotalRevenue = g.SelectMany(c => c.Orders)
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
                    .Sum(o => o.TotalAmount)
            })
            .OrderByDescending(c => c.TotalRevenue)
            .Take(10)
            .ToListAsync();

        return analytics;
    }

    private async Task<TimeBasedAnalyticsDto> GetTimeBasedAnalytics()
    {
        var analytics = new TimeBasedAnalyticsDto();
        var now = DateTime.UtcNow;
        var currentYear = now.Year;

        var last8Quarters = Enumerable.Range(0, 8)
            .Select(i =>
            {
                var date = now.AddMonths(-i * 3);
                return new { Year = date.Year, Quarter = (date.Month - 1) / 3 + 1 };
            })
            .Distinct()
            .OrderBy(q => q.Year)
            .ThenBy(q => q.Quarter)
            .ToList();

        analytics.QuarterlyPerformance = new List<QuarterlyPerformanceDto>();
        decimal previousRevenue = 0;
        foreach (var q in last8Quarters)
        {
            var quarterStart = ToUtc(q.Year, (q.Quarter - 1) * 3 + 1, 1);
            var quarterEnd = quarterStart.AddMonths(3).AddDays(-1);

            var revenue = await _context.Orders
                .Where(o => o.OrderDate >= quarterStart && o.OrderDate <= quarterEnd &&
                           (o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived))
                .SumAsync(o => o.TotalAmount);
            var orderCount = await _context.Orders
                .CountAsync(o => o.OrderDate >= quarterStart && o.OrderDate <= quarterEnd);
            var leadCount = await _context.Leads
                .CountAsync(l => l.CreatedAt >= quarterStart && l.CreatedAt <= quarterEnd);

            var growth = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;

            analytics.QuarterlyPerformance.Add(new QuarterlyPerformanceDto
            {
                Year = q.Year,
                Quarter = q.Quarter,
                Revenue = revenue,
                OrderCount = orderCount,
                LeadCount = leadCount,
                GrowthPercent = growth
            });

            previousRevenue = revenue;
        }

        var orders = await _context.Orders
            .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
            .ToListAsync();
        var leads = await _context.Leads.ToListAsync();

        var dayNames = new[] { "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };
        analytics.DayOfWeekPerformance = Enumerable.Range(0, 7).Select(dayNum =>
        {
            var dayOrders = orders.Where(o => (int)o.OrderDate.DayOfWeek == dayNum).ToList();
            var dayLeads = leads.Where(l => (int)l.CreatedAt.DayOfWeek == dayNum).ToList();
            var dayConversions = leads.Where(l => l.ConvertedDate.HasValue && (int)l.ConvertedDate.Value.DayOfWeek == dayNum).ToList();

            return new DayOfWeekPerformanceDto
            {
                DayOfWeek = dayNames[dayNum],
                DayNumber = dayNum,
                OrderCount = dayOrders.Count,
                LeadCount = dayLeads.Count,
                ConversionCount = dayConversions.Count,
                AverageOrderValue = dayOrders.Any() ? dayOrders.Average(o => o.TotalAmount) : 0
            };
        }).ToList();

        var thisYearStart = ToUtc(currentYear, 1, 1);
        var lastYearStart = ToUtc(currentYear - 1, 1, 1);
        var lastYearEnd = thisYearStart.AddDays(-1);

        var thisYearRevenue = await _context.Orders
            .Where(o => o.OrderDate >= thisYearStart && (o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived))
            .SumAsync(o => o.TotalAmount);
        var lastYearRevenue = await _context.Orders
            .Where(o => o.OrderDate >= lastYearStart && o.OrderDate <= lastYearEnd && (o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived))
            .SumAsync(o => o.TotalAmount);

        var thisYearLeads = await _context.Leads.CountAsync(l => l.CreatedAt >= thisYearStart);
        var lastYearLeads = await _context.Leads.CountAsync(l => l.CreatedAt >= lastYearStart && l.CreatedAt <= lastYearEnd);

        var thisYearOrders = await _context.Orders.CountAsync(o => o.OrderDate >= thisYearStart);
        var lastYearOrders = await _context.Orders.CountAsync(o => o.OrderDate >= lastYearStart && o.OrderDate <= lastYearEnd);

        var thisYearCustomers = await _context.Customers.CountAsync(c => c.CreatedAt >= thisYearStart);
        var lastYearCustomers = await _context.Customers.CountAsync(c => c.CreatedAt >= lastYearStart && c.CreatedAt <= lastYearEnd);

        analytics.YearOverYearComparison = new List<YearOverYearComparisonDto>
        {
            new() { Metric = "Revenue", CurrentYearValue = thisYearRevenue, PreviousYearValue = lastYearRevenue, GrowthPercent = lastYearRevenue > 0 ? ((thisYearRevenue - lastYearRevenue) / lastYearRevenue) * 100 : 0 },
            new() { Metric = "Leads", CurrentYearValue = thisYearLeads, PreviousYearValue = lastYearLeads, GrowthPercent = lastYearLeads > 0 ? ((decimal)(thisYearLeads - lastYearLeads) / lastYearLeads) * 100 : 0 },
            new() { Metric = "Orders", CurrentYearValue = thisYearOrders, PreviousYearValue = lastYearOrders, GrowthPercent = lastYearOrders > 0 ? ((decimal)(thisYearOrders - lastYearOrders) / lastYearOrders) * 100 : 0 },
            new() { Metric = "Customers", CurrentYearValue = thisYearCustomers, PreviousYearValue = lastYearCustomers, GrowthPercent = lastYearCustomers > 0 ? ((decimal)(thisYearCustomers - lastYearCustomers) / lastYearCustomers) * 100 : 0 }
        };

        var leadsWithConversion = await _context.Leads
            .Where(l => l.Status == LeadStatus.Converted && l.ConvertedDate.HasValue)
            .ToListAsync();

        var customersWithOrders = await _context.Customers
            .Include(c => c.Orders)
            .Where(c => c.Orders.Any())
            .ToListAsync();

        var timeToFirstOrder = customersWithOrders
            .Select(c => (c.Orders.Min(o => o.OrderDate) - c.CreatedAt).TotalDays)
            .Where(d => d >= 0)
            .ToList();
        analytics.AverageTimeToFirstOrderDays = timeToFirstOrder.Any() ? timeToFirstOrder.Average() : 0;

        var ordersWithDelivery = await _context.Orders
            .Where(o => o.ActualDeliveryDate.HasValue && o.ExpectedDeliveryDate.HasValue)
            .ToListAsync();
        var fulfillmentTimes = ordersWithDelivery
            .Select(o => (o.ActualDeliveryDate!.Value - o.OrderDate).TotalDays)
            .ToList();
        analytics.AverageOrderFulfillmentDays = fulfillmentTimes.Any() ? fulfillmentTimes.Average() : 0;

        return analytics;
    }

    private async Task<FinancialHealthDto> GetFinancialHealth()
    {
        var now = DateTime.UtcNow;
        var pendingOrders = await _context.Orders
            .Include(o => o.Customer)
            .Where(o => o.PaymentStatus != PaymentStatus.Paid)
            .ToListAsync();

        var health = new FinancialHealthDto
        {
            TotalOutstandingAmount = pendingOrders.Sum(o => o.TotalAmount),
            OutstandingWithin30Days = pendingOrders.Where(o => (now - o.OrderDate).TotalDays <= 30).Sum(o => o.TotalAmount),
            Outstanding30To60Days = pendingOrders.Where(o => (now - o.OrderDate).TotalDays > 30 && (now - o.OrderDate).TotalDays <= 60).Sum(o => o.TotalAmount),
            OutstandingOver60Days = pendingOrders.Where(o => (now - o.OrderDate).TotalDays > 60).Sum(o => o.TotalAmount),
            TotalTaxCollected = await _context.Orders
                .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
                .SumAsync(o => o.TaxAmount),
            TotalDiscountsGiven = await _context.Orders.SumAsync(o => o.DiscountAmount)
        };

        var expiringWithoutAutoRenew = await _context.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active && !s.AutoRenew && s.RenewalDate <= now.AddDays(90))
            .SumAsync(s => s.AnnualFee);
        health.RevenueAtRisk = expiringWithoutAutoRenew;

        health.TopOutstandingCustomers = pendingOrders
            .GroupBy(o => new { o.CustomerId, o.Customer!.CompanyName })
            .Select(g => new OutstandingByCustomerDto
            {
                CustomerId = g.Key.CustomerId,
                CompanyName = g.Key.CompanyName,
                OutstandingAmount = g.Sum(o => o.TotalAmount),
                PendingOrderCount = g.Count(),
                DaysOutstanding = (int)g.Max(o => (now - o.OrderDate).TotalDays)
            })
            .OrderByDescending(c => c.OutstandingAmount)
            .Take(10)
            .ToList();

        var upcomingRenewals = await _context.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active)
            .ToListAsync();

        health.CashFlowProjection = new List<CashFlowProjectionDto>
        {
            new() {
                Period = "Next 30 Days",
                RenewalRevenue = upcomingRenewals.Where(s => s.RenewalDate <= now.AddDays(30)).Sum(s => s.AnnualFee),
                NewBusinessRevenue = health.OutstandingWithin30Days,
                ExpectedInflow = upcomingRenewals.Where(s => s.RenewalDate <= now.AddDays(30)).Sum(s => s.AnnualFee) + health.OutstandingWithin30Days
            },
            new() {
                Period = "Next 60 Days",
                RenewalRevenue = upcomingRenewals.Where(s => s.RenewalDate <= now.AddDays(60)).Sum(s => s.AnnualFee),
                NewBusinessRevenue = health.OutstandingWithin30Days + health.Outstanding30To60Days,
                ExpectedInflow = upcomingRenewals.Where(s => s.RenewalDate <= now.AddDays(60)).Sum(s => s.AnnualFee) + health.OutstandingWithin30Days + health.Outstanding30To60Days
            },
            new() {
                Period = "Next 90 Days",
                RenewalRevenue = upcomingRenewals.Where(s => s.RenewalDate <= now.AddDays(90)).Sum(s => s.AnnualFee),
                NewBusinessRevenue = health.TotalOutstandingAmount,
                ExpectedInflow = upcomingRenewals.Where(s => s.RenewalDate <= now.AddDays(90)).Sum(s => s.AnnualFee) + health.TotalOutstandingAmount
            }
        };

        return health;
    }

    private async Task<DashboardAlertsDto> GetDashboardAlerts()
    {
        var now = DateTime.UtcNow;
        var alerts = new DashboardAlertsDto();

        var expiringSubscriptions = await _context.Subscriptions
            .Include(s => s.Customer)
            .Where(s => s.Status == SubscriptionStatus.Active && s.RenewalDate <= now.AddDays(30))
            .OrderBy(s => s.RenewalDate)
            .Take(10)
            .ToListAsync();

        alerts.ExpiringSubscriptions = expiringSubscriptions.Select(s => new AlertItemDto
        {
            Type = "SubscriptionExpiring",
            Severity = s.RenewalDate <= now.AddDays(7) ? "Critical" : "Warning",
            Title = $"Subscription expiring: {s.Customer?.CompanyName}",
            Description = $"Subscription #{s.SubscriptionNumber} expires on {s.RenewalDate:MMM dd, yyyy}",
            RelatedId = s.SubscriptionId,
            RelatedEntity = "Subscription",
            DueDate = s.RenewalDate,
            Amount = s.AnnualFee
        }).ToList();

        var overduePayments = await _context.Orders
            .Include(o => o.Customer)
            .Where(o => o.PaymentStatus != PaymentStatus.Paid && o.OrderDate < now.AddDays(-30))
            .OrderBy(o => o.OrderDate)
            .Take(10)
            .ToListAsync();

        alerts.OverduePayments = overduePayments.Select(o => new AlertItemDto
        {
            Type = "OverduePayment",
            Severity = (now - o.OrderDate).TotalDays > 60 ? "Critical" : "Warning",
            Title = $"Overdue payment: {o.Customer?.CompanyName}",
            Description = $"Order #{o.OrderNumber} - {(now - o.OrderDate).TotalDays:N0} days overdue",
            RelatedId = o.OrderId,
            RelatedEntity = "Order",
            DueDate = o.OrderDate,
            Amount = o.TotalAmount
        }).ToList();

        var staleLeads = await _context.Leads
            .Where(l => (l.Status == LeadStatus.New || l.Status == LeadStatus.Demo) && l.UpdatedAt < now.AddDays(-14))
            .OrderBy(l => l.UpdatedAt)
            .Take(10)
            .ToListAsync();

        alerts.StaleLeads = staleLeads.Select(l => new AlertItemDto
        {
            Type = "StaleLead",
            Severity = (now - l.UpdatedAt).TotalDays > 30 ? "Warning" : "Info",
            Title = $"Stale lead: {l.CompanyName}",
            Description = $"No activity for {(now - l.UpdatedAt).TotalDays:N0} days",
            RelatedId = l.LeadId,
            RelatedEntity = "Lead",
            DueDate = l.UpdatedAt,
            Amount = l.EstimatedValue
        }).ToList();

        var overdueActivities = await _context.Activities
            .Where(a => a.DueDate.HasValue && a.DueDate < now && a.Status != ActivityStatus.Completed && a.Status != ActivityStatus.Cancelled)
            .OrderBy(a => a.DueDate)
            .Take(10)
            .ToListAsync();

        alerts.OverdueActivities = overdueActivities.Select(a => new AlertItemDto
        {
            Type = "OverdueActivity",
            Severity = (now - a.DueDate!.Value).TotalDays > 7 ? "Warning" : "Info",
            Title = $"Overdue: {a.Subject ?? a.ActivityType.ToString()}",
            Description = $"Due on {a.DueDate:MMM dd, yyyy}",
            RelatedId = a.ActivityId,
            RelatedEntity = "Activity",
            DueDate = a.DueDate
        }).ToList();

        alerts.CriticalAlertCount = alerts.ExpiringSubscriptions.Count(a => a.Severity == "Critical") +
                                    alerts.OverduePayments.Count(a => a.Severity == "Critical");
        alerts.WarningAlertCount = alerts.ExpiringSubscriptions.Count(a => a.Severity == "Warning") +
                                   alerts.OverduePayments.Count(a => a.Severity == "Warning") +
                                   alerts.StaleLeads.Count(a => a.Severity == "Warning") +
                                   alerts.OverdueActivities.Count(a => a.Severity == "Warning");
        alerts.InfoAlertCount = alerts.StaleLeads.Count(a => a.Severity == "Info") +
                                alerts.OverdueActivities.Count(a => a.Severity == "Info");

        return alerts;
    }

    #endregion
}

public class DashboardStats
{
    public int TotalLeads { get; set; }
    public int NewLeads { get; set; }
    public int DemoLeads { get; set; }
    public int ConvertedLeads { get; set; }
    public int LostLeads { get; set; }
    public decimal LeadConversionRate { get; set; }

    public int TotalCustomers { get; set; }

    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int ConfirmedOrders { get; set; }
    public int DeliveredOrders { get; set; }

    public int TotalSubscriptions { get; set; }
    public int ActiveSubscriptions { get; set; }
    public int ExpiredSubscriptions { get; set; }

    public decimal TotalRevenue { get; set; }
    public decimal TotalEarnings { get; set; }

    public int UpcomingRenewals30Days { get; set; }
    public int UpcomingRenewals90Days { get; set; }
}
