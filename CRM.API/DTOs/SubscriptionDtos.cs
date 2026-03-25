using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs;

public class CancelSubscriptionRequest
{
    [Required]
    [MaxLength(1000)]
    public string CancellationReason { get; set; } = string.Empty;
}

public class SuspendSubscriptionRequest
{
    [Required]
    [MaxLength(1000)]
    public string SuspensionReason { get; set; } = string.Empty;
}

public class SubscriptionHistoryDto
{
    public int HistoryId { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? Description { get; set; }
    public int? RelatedOrderId { get; set; }
    public string? RelatedOrderNumber { get; set; }
    public DateTime ChangedAt { get; set; }
    public string ChangedByUserName { get; set; } = string.Empty;
}
