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

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<DashboardStats>>> GetStats()
    {
        try
        {
            var stats = new DashboardStats
            {
                TotalLeads = await _context.Leads.CountAsync(),
                NewLeads = await _context.Leads.CountAsync(l => l.Status == LeadStatus.New),
                DemoLeads = await _context.Leads.CountAsync(l => l.Status == LeadStatus.Demo),
                ConvertedLeads = await _context.Leads.CountAsync(l => l.Status == LeadStatus.Converted),
                LostLeads = await _context.Leads.CountAsync(l => l.Status == LeadStatus.Lost),
                
                TotalCustomers = await _context.Customers.CountAsync(),
                
                TotalOrders = await _context.Orders.CountAsync(),
                PendingOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Pending),
                ConfirmedOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Confirmed),
                DeliveredOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Delivered),
                
                TotalSubscriptions = await _context.Subscriptions.CountAsync(),
                ActiveSubscriptions = await _context.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Active),
                ExpiredSubscriptions = await _context.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Expired),
                
                TotalRevenue = await _context.Orders
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.Delivered)
                    .SumAsync(o => o.TotalAmount),
                
                UpcomingRenewals30Days = await _context.Subscriptions
                    .CountAsync(s => s.Status == SubscriptionStatus.Active && 
                                   s.RenewalDate >= DateTime.UtcNow.Date && 
                                   s.RenewalDate <= DateTime.UtcNow.Date.AddDays(30)),
                
                UpcomingRenewals90Days = await _context.Subscriptions
                    .CountAsync(s => s.Status == SubscriptionStatus.Active && 
                                   s.RenewalDate >= DateTime.UtcNow.Date && 
                                   s.RenewalDate <= DateTime.UtcNow.Date.AddDays(90))
            };

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
            var activities = await _context.Activities
                .Include(a => a.CreatedByUser)
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
    
    public int UpcomingRenewals30Days { get; set; }
    public int UpcomingRenewals90Days { get; set; }
}
