using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRM.API.Models;

public class Notification : BaseEntity
{
    [Key]
    public int NotificationId { get; set; }
    
    [Required]
    [ForeignKey("User")]
    public int UserId { get; set; }
    
    [Required]
    public NotificationType NotificationType { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    public string Message { get; set; } = string.Empty;
    
    public RelatedToType? RelatedToType { get; set; }
    
    public int? RelatedToId { get; set; }
    
    public bool IsRead { get; set; } = false;
    
    public DateTime? ReadAt { get; set; }
    
    public NotificationPriority Priority { get; set; } = NotificationPriority.Medium;
    
    public bool ShouldSendEmail { get; set; } = false;
    
    public bool EmailSent { get; set; } = false;
    
    public DateTime? EmailSentAt { get; set; }
    
    public string? EmailError { get; set; }
    
    [Column(TypeName = "json")]
    public string? CustomFields { get; set; }
    
    // Navigation Properties
    public User User { get; set; } = null!;
}

public enum NotificationType
{
    LeadAssigned,
    LeadConverted,
    OrderCreated,
    OrderConfirmed,
    SubscriptionCreated,
    SubscriptionRenewalDue,
    SubscriptionExpired,
    TaskAssigned,
    ActivityOverdue,
    SystemAlert
}

public enum NotificationPriority
{
    Low,
    Medium,
    High
}
