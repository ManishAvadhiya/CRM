using CRM.API.Data;
using CRM.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Services;

public interface INotificationService
{
    Task CreateNotificationAsync(int userId, NotificationType type, string title, string message, 
        RelatedToType? relatedType = null, int? relatedId = null, bool sendEmail = false);
    Task<List<Notification>> GetUserNotificationsAsync(int userId, bool unreadOnly = false);
    Task<bool> MarkAsReadAsync(int notificationId, int userId);
    Task<bool> MarkAllAsReadAsync(int userId);
}

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ApplicationDbContext context, IEmailService emailService, ILogger<NotificationService> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task CreateNotificationAsync(int userId, NotificationType type, string title, string message, 
        RelatedToType? relatedType = null, int? relatedId = null, bool sendEmail = false)
    {
        try
        {
            var notification = new Notification
            {
                UserId = userId,
                NotificationType = type,
                Title = title,
                Message = message,
                RelatedToType = relatedType,
                RelatedToId = relatedId,
                ShouldSendEmail = sendEmail,
                Priority = DeterminePriority(type),
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Send email if required
            if (sendEmail)
            {
                var user = await _context.Users.FindAsync(userId);
                if (user != null && !string.IsNullOrEmpty(user.Email))
                {
                    var emailSent = await _emailService.SendNotificationEmailAsync(user.Email, title, message);
                    
                    notification.EmailSent = emailSent;
                    notification.EmailSentAt = emailSent ? DateTime.UtcNow : null;
                    
                    if (!emailSent)
                    {
                        notification.EmailError = "Failed to send email";
                    }
                    
                    await _context.SaveChangesAsync();
                }
            }

            _logger.LogInformation($"Notification created for user {userId}: {title}");
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error creating notification: {ex.Message}");
        }
    }

    public async Task<List<Notification>> GetUserNotificationsAsync(int userId, bool unreadOnly = false)
    {
        var query = _context.Notifications
            .Where(n => n.UserId == userId);

        if (unreadOnly)
        {
            query = query.Where(n => !n.IsRead);
        }

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();
    }

    public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.UserId == userId);

        if (notification == null)
            return false;

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> MarkAllAsReadAsync(int userId)
    {
        var unreadNotifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private NotificationPriority DeterminePriority(NotificationType type)
    {
        return type switch
        {
            NotificationType.SubscriptionExpired => NotificationPriority.High,
            NotificationType.SubscriptionRenewalDue => NotificationPriority.High,
            NotificationType.OrderConfirmed => NotificationPriority.High,
            NotificationType.ActivityOverdue => NotificationPriority.High,
            NotificationType.LeadAssigned => NotificationPriority.Medium,
            NotificationType.TaskAssigned => NotificationPriority.Medium,
            _ => NotificationPriority.Low
        };
    }
}
