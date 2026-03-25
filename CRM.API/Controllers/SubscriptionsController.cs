using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.DTOs;
using CRM.API.Models;
using CRM.API.Services;
using System.Security.Claims;

namespace CRM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SubscriptionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SubscriptionsController> _logger;
    private readonly INotificationService _notificationService;

    public SubscriptionsController(
        ApplicationDbContext context,
        ILogger<SubscriptionsController> logger,
        INotificationService notificationService)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
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

    [HttpGet("renewable")]
    public async Task<ActionResult<ApiResponse<List<Subscription>>>> GetRenewable()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var query = _context.Subscriptions
                .Include(s => s.Customer)
                .Include(s => s.ProductVariant)
                .Include(s => s.Order)
                .Where(s => s.Status == SubscriptionStatus.Active || s.Status == SubscriptionStatus.Expired)
                .AsQueryable();

            if (userRole == "Partner")
            {
                query = query.Where(s => s.Order.CreatedBy == currentUserId);
            }

            var subscriptions = await query
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<List<Subscription>>.SuccessResponse(subscriptions));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching renewable subscriptions: {ex.Message}");
            return StatusCode(500, ApiResponse<List<Subscription>>.ErrorResponse("Error fetching renewable subscriptions"));
        }
    }

    [HttpGet("{id}/history")]
    public async Task<ActionResult<ApiResponse<List<SubscriptionHistoryDto>>>> GetHistory(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var subscription = await _context.Subscriptions
                .Include(s => s.Order)
                .FirstOrDefaultAsync(s => s.SubscriptionId == id);

            if (subscription == null)
            {
                return NotFound(ApiResponse<List<SubscriptionHistoryDto>>.ErrorResponse("Subscription not found"));
            }

            if (userRole == "Partner" && subscription.Order.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            var history = await _context.SubscriptionHistories
                .Include(h => h.ChangedByUser)
                .Include(h => h.RelatedOrder)
                .Where(h => h.SubscriptionId == id)
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => new SubscriptionHistoryDto
                {
                    HistoryId = h.HistoryId,
                    ChangeType = h.ChangeType.ToString(),
                    OldValue = h.OldValue,
                    NewValue = h.NewValue,
                    Description = h.Description,
                    RelatedOrderId = h.RelatedOrderId,
                    RelatedOrderNumber = h.RelatedOrder != null ? h.RelatedOrder.OrderNumber : null,
                    ChangedAt = h.ChangedAt,
                    ChangedByUserName = h.ChangedByUser != null ? h.ChangedByUser.Name : "Unknown"
                })
                .ToListAsync();

            return Ok(ApiResponse<List<SubscriptionHistoryDto>>.SuccessResponse(history));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching subscription history: {ex.Message}");
            return StatusCode(500, ApiResponse<List<SubscriptionHistoryDto>>.ErrorResponse("Error fetching subscription history"));
        }
    }

    [HttpPut("{id}/cancel")]
    public async Task<ActionResult<ApiResponse<Subscription>>> Cancel(int id, [FromBody] CancelSubscriptionRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var subscription = await _context.Subscriptions
                .Include(s => s.Customer)
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

            if (subscription.Status == SubscriptionStatus.Cancelled)
            {
                return BadRequest(ApiResponse<Subscription>.ErrorResponse("Subscription is already cancelled"));
            }

            var oldStatus = subscription.Status.ToString();

            subscription.Status = SubscriptionStatus.Cancelled;
            subscription.CancellationDate = DateTime.UtcNow;
            subscription.CancellationReason = request.CancellationReason;
            subscription.CancelledBy = currentUserId;
            subscription.UpdatedAt = DateTime.UtcNow;

            // Create history entry
            var history = new SubscriptionHistory
            {
                SubscriptionId = id,
                ChangedByUserId = currentUserId,
                ChangeType = SubscriptionChangeType.Cancelled,
                OldValue = oldStatus,
                NewValue = "Cancelled",
                Description = request.CancellationReason,
                ChangedAt = DateTime.UtcNow
            };
            _context.SubscriptionHistories.Add(history);

            await _context.SaveChangesAsync();

            // Send notification
            if (subscription.Customer.AccountOwner.HasValue)
            {
                await _notificationService.CreateNotificationAsync(
                    subscription.Customer.AccountOwner.Value,
                    NotificationType.SubscriptionRenewed,
                    "Subscription Cancelled",
                    $"Subscription {subscription.SubscriptionNumber} for {subscription.Customer.CompanyName} has been cancelled.",
                    RelatedToType.Subscription,
                    subscription.SubscriptionId
                );
            }

            return Ok(ApiResponse<Subscription>.SuccessResponse(subscription, "Subscription cancelled successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error cancelling subscription: {ex.Message}");
            return StatusCode(500, ApiResponse<Subscription>.ErrorResponse("Error cancelling subscription"));
        }
    }

    [HttpPut("{id}/suspend")]
    public async Task<ActionResult<ApiResponse<Subscription>>> Suspend(int id, [FromBody] SuspendSubscriptionRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var subscription = await _context.Subscriptions
                .Include(s => s.Customer)
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

            if (subscription.Status != SubscriptionStatus.Active)
            {
                return BadRequest(ApiResponse<Subscription>.ErrorResponse("Only active subscriptions can be suspended"));
            }

            var oldStatus = subscription.Status.ToString();

            subscription.Status = SubscriptionStatus.Suspended;
            subscription.SuspensionDate = DateTime.UtcNow;
            subscription.SuspensionReason = request.SuspensionReason;
            subscription.SuspendedBy = currentUserId;
            subscription.UpdatedAt = DateTime.UtcNow;

            // Create history entry
            var history = new SubscriptionHistory
            {
                SubscriptionId = id,
                ChangedByUserId = currentUserId,
                ChangeType = SubscriptionChangeType.Suspended,
                OldValue = oldStatus,
                NewValue = "Suspended",
                Description = request.SuspensionReason,
                ChangedAt = DateTime.UtcNow
            };
            _context.SubscriptionHistories.Add(history);

            await _context.SaveChangesAsync();

            return Ok(ApiResponse<Subscription>.SuccessResponse(subscription, "Subscription suspended successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error suspending subscription: {ex.Message}");
            return StatusCode(500, ApiResponse<Subscription>.ErrorResponse("Error suspending subscription"));
        }
    }

    [HttpPut("{id}/reactivate")]
    public async Task<ActionResult<ApiResponse<Subscription>>> Reactivate(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var subscription = await _context.Subscriptions
                .Include(s => s.Customer)
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

            if (subscription.Status != SubscriptionStatus.Suspended)
            {
                return BadRequest(ApiResponse<Subscription>.ErrorResponse("Only suspended subscriptions can be reactivated"));
            }

            var oldStatus = subscription.Status.ToString();

            subscription.Status = SubscriptionStatus.Active;
            subscription.SuspensionDate = null;
            subscription.SuspensionReason = null;
            subscription.SuspendedBy = null;
            subscription.UpdatedAt = DateTime.UtcNow;

            // Create history entry
            var history = new SubscriptionHistory
            {
                SubscriptionId = id,
                ChangedByUserId = currentUserId,
                ChangeType = SubscriptionChangeType.Reactivated,
                OldValue = oldStatus,
                NewValue = "Active",
                Description = "Subscription reactivated",
                ChangedAt = DateTime.UtcNow
            };
            _context.SubscriptionHistories.Add(history);

            await _context.SaveChangesAsync();

            return Ok(ApiResponse<Subscription>.SuccessResponse(subscription, "Subscription reactivated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error reactivating subscription: {ex.Message}");
            return StatusCode(500, ApiResponse<Subscription>.ErrorResponse("Error reactivating subscription"));
        }
    }
}
