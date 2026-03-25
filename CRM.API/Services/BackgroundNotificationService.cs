using CRM.API.Data;
using CRM.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Services;

public class BackgroundNotificationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BackgroundNotificationService> _logger;

    public BackgroundNotificationService(
        IServiceProvider serviceProvider,
        ILogger<BackgroundNotificationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Background Notification Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckSubscriptionExpirations();

                // Run every hour
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in Background Notification Service: {ex.Message}");
                // Wait a bit before retrying
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        _logger.LogInformation("Background Notification Service stopped");
    }

    private async Task CheckSubscriptionExpirations()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        try
        {
            var today = DateTime.UtcNow;
            var thirtyDaysFromNow = today.AddDays(30);

            // Get active subscriptions expiring in next 30 days
            var expiringSubscriptions = await context.Subscriptions
                .Include(s => s.Customer)
                .ThenInclude(c => c.AccountOwnerUser)
                .Where(s => !s.IsDeleted
                    && s.Status == SubscriptionStatus.Active
                    && s.RenewalDate <= thirtyDaysFromNow
                    && s.RenewalDate > today)
                .ToListAsync();

            foreach (var subscription in expiringSubscriptions)
            {
                var daysUntilExpiry = (subscription.RenewalDate - today).Days;

                // Send notifications at 30, 14, 7, 3, and 1 day(s) before expiry
                if (daysUntilExpiry == 30 || daysUntilExpiry == 14 || daysUntilExpiry == 7 ||
                    daysUntilExpiry == 3 || daysUntilExpiry == 1)
                {
                    // Check if we already sent a notification for this specific day
                    var existingNotification = await context.Notifications
                        .AnyAsync(n => n.RelatedToType == RelatedToType.Subscription
                            && n.RelatedToId == subscription.SubscriptionId
                            && n.NotificationType == NotificationType.SubscriptionRenewalDue
                            && n.CreatedAt.Date == today.Date);

                    if (!existingNotification && subscription.Customer?.AccountOwner != null)
                    {
                        await notificationService.CreateNotificationAsync(
                            subscription.Customer.AccountOwner.Value,
                            NotificationType.SubscriptionRenewalDue,
                            "Subscription Renewal Due",
                            $"Subscription {subscription.SubscriptionNumber} will expire in {daysUntilExpiry} day(s)",
                            RelatedToType.Subscription,
                            subscription.SubscriptionId,
                            sendEmail: daysUntilExpiry <= 7 // Send email for 7 days or less
                        );

                        _logger.LogInformation($"Created renewal notification for subscription {subscription.SubscriptionId}");
                    }
                }
            }

            // Check for newly expired subscriptions
            var newlyExpiredSubscriptions = await context.Subscriptions
                .Include(s => s.Customer)
                .Where(s => !s.IsDeleted
                    && s.Status == SubscriptionStatus.Active
                    && s.RenewalDate.Date == today.Date.AddDays(-1))
                .ToListAsync();

            foreach (var subscription in newlyExpiredSubscriptions)
            {
                if (subscription.Customer?.AccountOwner != null)
                {
                    await notificationService.CreateNotificationAsync(
                        subscription.Customer.AccountOwner.Value,
                        NotificationType.SubscriptionExpired,
                        "Subscription Expired",
                        $"Subscription {subscription.SubscriptionNumber} has expired",
                        RelatedToType.Subscription,
                        subscription.SubscriptionId,
                        sendEmail: true
                    );

                    _logger.LogInformation($"Created expiry notification for subscription {subscription.SubscriptionId}");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error checking subscription expirations: {ex.Message}");
        }
    }
}
