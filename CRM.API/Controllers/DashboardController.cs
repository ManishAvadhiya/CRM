using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.DTOs;
using CRM.API.Models;

namespace CRM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DashboardController> _logger;

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

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<DashboardStats>>> GetStats()
    {
        try
        {
            const decimal commissionRate = 10m;
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            
            var stats = new DashboardStats();

            if (userRole == "Partner")
            {
                // Partner-specific dashboard stats
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
                stats.DeliveredOrders = await partnerOrders.CountAsync(o => o.Status == OrderStatus.Delivered);

                stats.TotalSubscriptions = await partnerSubscriptions.CountAsync();
                stats.ActiveSubscriptions = await partnerSubscriptions.CountAsync(s => s.Status == SubscriptionStatus.Active);
                stats.ExpiredSubscriptions = await partnerSubscriptions.CountAsync(s => s.Status == SubscriptionStatus.Expired);

                stats.TotalRevenue = await partnerOrders
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.Delivered)
                    .SumAsync(o => o.TotalAmount);

                stats.TotalEarnings = Math.Round(stats.TotalRevenue * commissionRate / 100m, 2);

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
                // Admin/Marketing dashboard - all stats
                stats.TotalLeads = await _context.Leads.CountAsync();
                stats.NewLeads = await _context.Leads.CountAsync(l => l.Status == LeadStatus.New);
                stats.DemoLeads = await _context.Leads.CountAsync(l => l.Status == LeadStatus.Demo);
                stats.ConvertedLeads = await _context.Leads.CountAsync(l => l.Status == LeadStatus.Converted);
                stats.LostLeads = await _context.Leads.CountAsync(l => l.Status == LeadStatus.Lost);

                stats.TotalCustomers = await _context.Customers.CountAsync();

                stats.TotalOrders = await _context.Orders.CountAsync();
                stats.PendingOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Pending);
                stats.ConfirmedOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Confirmed);
                stats.DeliveredOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Delivered);

                stats.TotalSubscriptions = await _context.Subscriptions.CountAsync();
                stats.ActiveSubscriptions = await _context.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Active);
                stats.ExpiredSubscriptions = await _context.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Expired);

                stats.TotalRevenue = await _context.Orders
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.Delivered)
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

            // Lead conversion rate
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
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            var query = _context.Activities
                .Include(a => a.CreatedByUser)
                .AsQueryable();

            // Role-based activity filtering
            if (userRole == "Partner")
            {
                // Partners see only their own activities
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
