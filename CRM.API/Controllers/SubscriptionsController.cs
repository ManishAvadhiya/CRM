using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.DTOs;
using CRM.API.Models;
using System.Security.Claims;

namespace CRM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SubscriptionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SubscriptionsController> _logger;

    public SubscriptionsController(ApplicationDbContext context, ILogger<SubscriptionsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<Subscription>>>> GetAll([FromQuery] string? status = null)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var query = _context.Subscriptions
                .Include(s => s.Customer)
                .Include(s => s.ProductVariant)
                .Include(s => s.Order)
                .AsQueryable();

            if (userRole == "Partner")
            {
                // Partners can only view subscriptions linked to their orders
                query = query.Where(s => s.Order.CreatedBy == currentUserId);
            }

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<SubscriptionStatus>(status, out var subStatus))
            {
                query = query.Where(s => s.Status == subStatus);
            }

            var subscriptions = await query
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<List<Subscription>>.SuccessResponse(subscriptions));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching subscriptions: {ex.Message}");
            return StatusCode(500, ApiResponse<List<Subscription>>.ErrorResponse("Error fetching subscriptions"));
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Subscription>>> GetById(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var subscription = await _context.Subscriptions
                .Include(s => s.Customer)
                .Include(s => s.ProductVariant)
                .Include(s => s.Order)
                .FirstOrDefaultAsync(s => s.SubscriptionId == id);

            if (subscription == null)
            {
                return NotFound(ApiResponse<Subscription>.ErrorResponse("Subscription not found"));
            }

            if (userRole == "Partner" && subscription.Order.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            return Ok(ApiResponse<Subscription>.SuccessResponse(subscription));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching subscription: {ex.Message}");
            return StatusCode(500, ApiResponse<Subscription>.ErrorResponse("Error fetching subscription"));
        }
    }

    [HttpGet("upcoming-renewals")]
    public async Task<ActionResult<ApiResponse<List<Subscription>>>> GetUpcomingRenewals([FromQuery] int days = 30)
    {
        try
        {
            var today = DateTime.UtcNow.Date;
            var futureDate = today.AddDays(days);
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var query = _context.Subscriptions
                .Include(s => s.Customer)
                .Include(s => s.ProductVariant)
                .Include(s => s.Order)
                .Where(s => s.Status == SubscriptionStatus.Active && 
                           s.RenewalDate >= today && 
                           s.RenewalDate <= futureDate)
                .AsQueryable();

            if (userRole == "Partner")
            {
                query = query.Where(s => s.Order.CreatedBy == currentUserId);
            }

            var subscriptions = await query
                .OrderBy(s => s.RenewalDate)
                .ToListAsync();

            return Ok(ApiResponse<List<Subscription>>.SuccessResponse(subscriptions));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching upcoming renewals: {ex.Message}");
            return StatusCode(500, ApiResponse<List<Subscription>>.ErrorResponse("Error fetching upcoming renewals"));
        }
    }
}
