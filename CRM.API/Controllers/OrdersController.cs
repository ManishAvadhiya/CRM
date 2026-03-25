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
public class OrdersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(ApplicationDbContext context, INotificationService notificationService, ILogger<OrdersController> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<Order>>>> GetAll()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            var query = _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.ProductVariant)
                .Include(o => o.CreatedByUser)
                .AsQueryable();

            // Role-based visibility
            if (userRole == "Partner")
            {
                // Partners can only see orders created by them
                query = query.Where(o => o.CreatedBy == currentUserId);
            }
            // ManagementAdmin and Marketing can see all orders

            var orders = await query
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return Ok(ApiResponse<List<Order>>.SuccessResponse(orders));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching orders: {ex.Message}");
            return StatusCode(500, ApiResponse<List<Order>>.ErrorResponse("Error fetching orders"));
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Order>>> GetById(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.ProductVariant)
                .Include(o => o.CreatedByUser)
                .Include(o => o.Subscription)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound(ApiResponse<Order>.ErrorResponse("Order not found"));
            }

            // Role-based access control
            if (userRole == "Partner" && order.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            return Ok(ApiResponse<Order>.SuccessResponse(order));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching order: {ex.Message}");
            return StatusCode(500, ApiResponse<Order>.ErrorResponse("Error fetching order"));
        }
    }

    [HttpGet("earnings")]
    public async Task<ActionResult<ApiResponse<List<PartnerEarningDto>>>> GetEarnings()
    {
        try
        {
            const decimal commissionRate = 10m;
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var query = _context.Orders
                .Include(o => o.Customer)
                .AsQueryable();

            if (userRole == "Partner")
            {
                query = query.Where(o => o.CreatedBy == currentUserId);
            }

            var earnings = await query
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new PartnerEarningDto
                {
                    OrderId = o.OrderId,
                    OrderNumber = o.OrderNumber,
                    OrderDate = o.OrderDate,
                    CustomerName = o.Customer != null ? o.Customer.CompanyName : "-",
                    OrderAmount = o.TotalAmount,
                    Status = o.Status.ToString(),
                    CommissionRate = commissionRate,
                    EarningAmount = (o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.Delivered)
                        ? Math.Round(o.TotalAmount * commissionRate / 100m, 2)
                        : 0m
                })
                .ToListAsync();

            return Ok(ApiResponse<List<PartnerEarningDto>>.SuccessResponse(earnings));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching partner earnings: {ex.Message}");
            return StatusCode(500, ApiResponse<List<PartnerEarningDto>>.ErrorResponse("Error fetching partner earnings"));
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Order>>> Create([FromBody] Order order)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Validate renewal order
            if (order.OrderType == OrderType.Renew)
            {
                if (!order.RenewedSubscriptionId.HasValue)
                {
                    return BadRequest(ApiResponse<Order>.ErrorResponse("Renewed subscription ID is required for renewal orders"));
                }

                var subscription = await _context.Subscriptions
                    .Include(s => s.Order)
                    .FirstOrDefaultAsync(s => s.SubscriptionId == order.RenewedSubscriptionId.Value);

                if (subscription == null)
                {
                    return BadRequest(ApiResponse<Order>.ErrorResponse("Invalid subscription for renewal"));
                }

                if (subscription.Status != SubscriptionStatus.Active && subscription.Status != SubscriptionStatus.Expired)
                {
                    return BadRequest(ApiResponse<Order>.ErrorResponse("Only active or expired subscriptions can be renewed"));
                }

                if (userRole == "Partner" && subscription.Order.CreatedBy != currentUserId)
                {
                    return Forbid();
                }

                // Use subscription's customer if not provided
                if (order.CustomerId == 0)
                {
                    order.CustomerId = subscription.CustomerId;
                }

                // Use subscription's variant if not provided (can be upgraded)
                if (order.VariantId == 0)
                {
                    order.VariantId = subscription.VariantId;
                }
            }

            // Get product variant to fetch pricing
            var variant = await _context.ProductVariants.FindAsync(order.VariantId);
            if (variant == null)
            {
                return BadRequest(ApiResponse<Order>.ErrorResponse("Invalid product variant"));
            }

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == order.CustomerId);
            if (customer == null)
            {
                return BadRequest(ApiResponse<Order>.ErrorResponse("Invalid customer"));
            }

            if (userRole == "Partner" && customer.CreatedBy != currentUserId && order.OrderType != OrderType.Renew)
            {
                return Forbid();
            }

            // Calculate amounts based on user license type
            order.BasePrice = order.UserLicenseType == UserLicenseType.SingleUser
                ? variant.BasePriceSingleUser
                : variant.BasePriceMultiUser;

            order.BaseAmount = order.BasePrice * order.Quantity;
            order.DiscountAmount = order.BaseAmount * (order.DiscountPercent / 100);
            order.SubTotal = order.BaseAmount + order.CustomizationAmount - order.DiscountAmount;
            order.TaxAmount = order.SubTotal * (order.TaxPercent / 100);
            order.TotalAmount = order.SubTotal + order.TaxAmount;

            // Generate order number
            var orderCount = await _context.Orders.CountAsync();
            order.OrderNumber = $"ORD-{DateTime.UtcNow.Year}-{(orderCount + 1):D4}";

            order.CreatedBy = currentUserId;
            order.CreatedAt = DateTime.UtcNow;
            order.OrderDate = DateTime.UtcNow.Date;

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Send notification
            customer = await _context.Customers
                .Include(c => c.AccountOwnerUser)
                .FirstOrDefaultAsync(c => c.CustomerId == order.CustomerId);

            if (customer?.AccountOwner != null)
            {
                var notificationTitle = order.OrderType == OrderType.Renew ? "Renewal Order Created" : "New Order Created";
                var notificationMessage = order.OrderType == OrderType.Renew
                    ? $"Renewal order {order.OrderNumber} has been created for {customer.CompanyName}"
                    : $"Order {order.OrderNumber} has been created for {customer.CompanyName}";

                await _notificationService.CreateNotificationAsync(
                    customer.AccountOwner.Value,
                    NotificationType.OrderCreated,
                    notificationTitle,
                    notificationMessage,
                    RelatedToType.Order,
                    order.OrderId,
                    sendEmail: true
                );
            }

            _logger.LogInformation($"Order created: {order.OrderId}, Type: {order.OrderType}");

            return CreatedAtAction(nameof(GetById), new { id = order.OrderId },
                ApiResponse<Order>.SuccessResponse(order, "Order created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error creating order: {ex.Message}");
            return StatusCode(500, ApiResponse<Order>.ErrorResponse("Error creating order"));
        }
    }

    [HttpPut("{id}/confirm")]
    public async Task<ActionResult<ApiResponse<Subscription>>> ConfirmOrder(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var order = await _context.Orders
                .Include(o => o.ProductVariant)
                .Include(o => o.Customer)
                    .ThenInclude(c => c.AccountOwnerUser)
                .Include(o => o.RenewedSubscription)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound(ApiResponse<Subscription>.ErrorResponse("Order not found"));
            }

            if (order.Status == OrderStatus.Confirmed)
            {
                return BadRequest(ApiResponse<Subscription>.ErrorResponse("Order already confirmed"));
            }

            if (userRole == "Partner" && order.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            // Update order status
            order.Status = OrderStatus.Confirmed;
            order.PaymentStatus = PaymentStatus.Paid;
            order.UpdatedAt = DateTime.UtcNow;

            Subscription subscription;

            if (order.OrderType == OrderType.Renew && order.RenewedSubscription != null)
            {
                // RENEWAL: Update existing subscription
                subscription = order.RenewedSubscription;
                var oldPeriodEnd = subscription.CurrentPeriodEnd;
                var oldVariantId = subscription.VariantId;

                subscription.RenewalCount++;
                subscription.CurrentPeriodStart = DateTime.UtcNow.Date;
                subscription.CurrentPeriodEnd = DateTime.UtcNow.Date.AddYears(1).AddDays(-1);
                subscription.RenewalDate = DateTime.UtcNow.Date.AddYears(1);
                subscription.Status = SubscriptionStatus.Active;
                subscription.AnnualFee = order.ProductVariant.AnnualSubscriptionFee;
                subscription.VariantId = order.VariantId; // In case of upgrade
                subscription.LastPaymentDate = DateTime.UtcNow;
                subscription.UpdatedAt = DateTime.UtcNow;

                // Clear any suspension/cancellation data
                subscription.SuspensionDate = null;
                subscription.SuspensionReason = null;
                subscription.SuspendedBy = null;
                subscription.CancellationDate = null;
                subscription.CancellationReason = null;
                subscription.CancelledBy = null;

                // Create renewal history entry
                var description = $"Renewed via order {order.OrderNumber}";
                if (oldVariantId != order.VariantId)
                {
                    var oldVariant = await _context.ProductVariants.FindAsync(oldVariantId);
                    description += $" (upgraded from {oldVariant?.VariantName ?? "Unknown"} to {order.ProductVariant.VariantName})";
                }

                var history = new SubscriptionHistory
                {
                    SubscriptionId = subscription.SubscriptionId,
                    ChangedByUserId = currentUserId,
                    ChangeType = SubscriptionChangeType.Renewed,
                    OldValue = oldPeriodEnd.ToString("yyyy-MM-dd"),
                    NewValue = subscription.CurrentPeriodEnd.ToString("yyyy-MM-dd"),
                    Description = description,
                    RelatedOrderId = order.OrderId,
                    ChangedAt = DateTime.UtcNow
                };
                _context.SubscriptionHistories.Add(history);

                // If variant changed, add another history entry
                if (oldVariantId != order.VariantId)
                {
                    var oldVariant = await _context.ProductVariants.FindAsync(oldVariantId);
                    var variantHistory = new SubscriptionHistory
                    {
                        SubscriptionId = subscription.SubscriptionId,
                        ChangedByUserId = currentUserId,
                        ChangeType = SubscriptionChangeType.VariantChanged,
                        OldValue = oldVariant?.VariantName ?? "Unknown",
                        NewValue = order.ProductVariant.VariantName,
                        Description = $"Product upgraded during renewal",
                        RelatedOrderId = order.OrderId,
                        ChangedAt = DateTime.UtcNow
                    };
                    _context.SubscriptionHistories.Add(variantHistory);
                }

                await _context.SaveChangesAsync();

                // Send renewal notification
                if (order.Customer.AccountOwner != null)
                {
                    await _notificationService.CreateNotificationAsync(
                        order.Customer.AccountOwner.Value,
                        NotificationType.SubscriptionRenewed,
                        "Subscription Renewed",
                        $"Subscription {subscription.SubscriptionNumber} for {order.Customer.CompanyName} has been renewed until {subscription.CurrentPeriodEnd:yyyy-MM-dd}",
                        RelatedToType.Subscription,
                        subscription.SubscriptionId,
                        sendEmail: true
                    );
                }

                _logger.LogInformation($"Order confirmed and subscription renewed: Order {order.OrderId}, Subscription {subscription.SubscriptionId}");
            }
            else
            {
                // NEW ORDER: Create new subscription
                var subscriptionCount = await _context.Subscriptions.CountAsync();
                var startDate = DateTime.UtcNow.Date;
                var renewalDate = startDate.AddYears(1);

                subscription = new Subscription
                {
                    SubscriptionNumber = $"SUB-{DateTime.UtcNow.Year}-{(subscriptionCount + 1):D4}",
                    CustomerId = order.CustomerId,
                    OrderId = order.OrderId,
                    VariantId = order.VariantId,
                    StartDate = startDate,
                    CurrentPeriodStart = startDate,
                    CurrentPeriodEnd = renewalDate.AddDays(-1),
                    RenewalDate = renewalDate,
                    AnnualFee = order.ProductVariant.AnnualSubscriptionFee,
                    Status = SubscriptionStatus.Active,
                    AutoRenew = true,
                    CreatedBy = currentUserId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Subscriptions.Add(subscription);
                await _context.SaveChangesAsync();

                // Create "Created" history entry
                var history = new SubscriptionHistory
                {
                    SubscriptionId = subscription.SubscriptionId,
                    ChangedByUserId = currentUserId,
                    ChangeType = SubscriptionChangeType.Created,
                    NewValue = "Active",
                    Description = $"Created via order {order.OrderNumber}",
                    RelatedOrderId = order.OrderId,
                    ChangedAt = DateTime.UtcNow
                };
                _context.SubscriptionHistories.Add(history);
                await _context.SaveChangesAsync();

                // Send notifications
                if (order.Customer.AccountOwner != null)
                {
                    await _notificationService.CreateNotificationAsync(
                        order.Customer.AccountOwner.Value,
                        NotificationType.OrderConfirmed,
                        "Order Confirmed",
                        $"Order {order.OrderNumber} has been confirmed and subscription created",
                        RelatedToType.Order,
                        order.OrderId,
                        sendEmail: true
                    );

                    await _notificationService.CreateNotificationAsync(
                        order.Customer.AccountOwner.Value,
                        NotificationType.SubscriptionCreated,
                        "Subscription Created",
                        $"Subscription {subscription.SubscriptionNumber} has been created for {order.Customer.CompanyName}",
                        RelatedToType.Subscription,
                        subscription.SubscriptionId,
                        sendEmail: true
                    );
                }

                _logger.LogInformation($"Order confirmed and subscription created: Order {order.OrderId}, Subscription {subscription.SubscriptionId}");
            }

            return Ok(ApiResponse<Subscription>.SuccessResponse(subscription, "Order confirmed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error confirming order: {ex.Message}");
            return StatusCode(500, ApiResponse<Subscription>.ErrorResponse("Error confirming order"));
        }
    }
}

public class PartnerEarningDto
{
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal OrderAmount { get; set; }
    public decimal CommissionRate { get; set; }
    public decimal EarningAmount { get; set; }
    public string Status { get; set; } = string.Empty;
}
