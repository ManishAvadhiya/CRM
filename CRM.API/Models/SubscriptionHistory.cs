using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRM.API.Models;

public class SubscriptionHistory : BaseEntity
{
    [Key]
    public int HistoryId { get; set; }

    [Required]
    [ForeignKey("Subscription")]
    public int SubscriptionId { get; set; }

    [Required]
    [ForeignKey("ChangedByUser")]
    public int ChangedByUserId { get; set; }

    [Required]
    public SubscriptionChangeType ChangeType { get; set; }

    [MaxLength(1000)]
    public string? OldValue { get; set; }

    [MaxLength(1000)]
    public string? NewValue { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    // For renewals: track the renewal order
    [ForeignKey("RelatedOrder")]
    public int? RelatedOrderId { get; set; }

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Subscription? Subscription { get; set; }
    public User? ChangedByUser { get; set; }
    public Order? RelatedOrder { get; set; }
}

public enum SubscriptionChangeType
{
    Created,
    Renewed,
    Cancelled,
    Suspended,
    Reactivated,
    Expired,
    VariantChanged,
    Other
}
