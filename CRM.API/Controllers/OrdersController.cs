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
            var orders = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.ProductVariant)
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
            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.ProductVariant)
                .Include(o => o.Subscription)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound(ApiResponse<Order>.ErrorResponse("Order not found"));
            }

            return Ok(ApiResponse<Order>.SuccessResponse(order));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching order: {ex.Message}");
            return StatusCode(500, ApiResponse<Order>.ErrorResponse("Error fetching order"));
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Order>>> Create([FromBody] Order order)
    {
        try
        {
            // Get product variant to fetch pricing
            var variant = await _context.ProductVariants.FindAsync(order.VariantId);
            if (variant == null)
            {
                return BadRequest(ApiResponse<Order>.ErrorResponse("Invalid product variant"));
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

            order.CreatedBy = GetCurrentUserId();
            order.CreatedAt = DateTime.UtcNow;
            order.OrderDate = DateTime.UtcNow.Date;

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Send notification
            var customer = await _context.Customers
                .Include(c => c.AccountOwnerUser)
                .FirstOrDefaultAsync(c => c.CustomerId == order.CustomerId);

            if (customer?.AccountOwner != null)
            {
                await _notificationService.CreateNotificationAsync(
                    customer.AccountOwner.Value,
                    NotificationType.OrderCreated,
                    "New Order Created",
                    $"Order {order.OrderNumber} has been created for {customer.CompanyName}",
                    RelatedToType.Order,
                    order.OrderId,
                    sendEmail: true
                );
            }

            _logger.LogInformation($"Order created: {order.OrderId}");

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
            var order = await _context.Orders
                .Include(o => o.ProductVariant)
                .Include(o => o.Customer)
                    .ThenInclude(c => c.AccountOwnerUser)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound(ApiResponse<Subscription>.ErrorResponse("Order not found"));
            }

            if (order.Status == OrderStatus.Confirmed)
            {
                return BadRequest(ApiResponse<Subscription>.ErrorResponse("Order already confirmed"));
            }

            // Update order status
            order.Status = OrderStatus.Confirmed;
            order.UpdatedAt = DateTime.UtcNow;

            // Create subscription automatically
            var subscriptionCount = await _context.Subscriptions.CountAsync();
            var startDate = DateTime.UtcNow.Date;
            var renewalDate = startDate.AddYears(1);

            var subscription = new Subscription
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
                CreatedBy = GetCurrentUserId(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Subscriptions.Add(subscription);
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

            return Ok(ApiResponse<Subscription>.SuccessResponse(subscription, "Order confirmed and subscription created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error confirming order: {ex.Message}");
            return StatusCode(500, ApiResponse<Subscription>.ErrorResponse("Error confirming order"));
        }
    }
}
