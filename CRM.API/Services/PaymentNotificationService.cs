using CRM.API.Data;
using CRM.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Services;

public interface IPaymentNotificationService
{
    Task SchedulePaymentReceivedNotificationAsync(int orderId);
}

public class PaymentNotificationService : IPaymentNotificationService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PaymentNotificationService> _logger;

    public PaymentNotificationService(
        IServiceProvider serviceProvider,
        ILogger<PaymentNotificationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task SchedulePaymentReceivedNotificationAsync(int orderId)
    {
        // Run the notification creation after 1 minute delay
        _ = Task.Run(async () =>
        {
            try
            {
                // Wait for 1 minute
                await Task.Delay(TimeSpan.FromMinutes(1));

                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                // Get the order details
                var order = await context.Orders
                    .Include(o => o.Customer)
                    .ThenInclude(c => c!.AccountOwnerUser)
                    .FirstOrDefaultAsync(o => o.OrderId == orderId);

                if (order != null)
                {
                    // Send to AccountOwner if set, otherwise to the order creator
                    var notifyUserId = order.Customer?.AccountOwner ?? order.CreatedBy;

                    if (notifyUserId > 0)
                    {
                        await notificationService.CreateNotificationAsync(
                            notifyUserId,
                            NotificationType.PaymentReceived,
                            "Payment Received",
                            $"Payment received for Order #{order.OrderNumber}",
                            RelatedToType.Order,
                            order.OrderId,
                            sendEmail: true
                        );

                        _logger.LogInformation($"Payment received notification created for Order {order.OrderId}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating payment notification: {ex.Message}");
            }
        });

        await Task.CompletedTask;
    }
}
