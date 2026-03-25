using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRM.API.Models;

public class Subscription : BaseEntity
{
    [Key]
    public int SubscriptionId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string SubscriptionNumber { get; set; } = string.Empty;
    
    [Required]
    [ForeignKey("Customer")]
    public int CustomerId { get; set; }
    
    [Required]
    [ForeignKey("Order")]
    public int OrderId { get; set; }
    
    [Required]
    [ForeignKey("ProductVariant")]
    public int VariantId { get; set; }
    
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime CurrentPeriodStart { get; set; }
    
    [Required]
    public DateTime CurrentPeriodEnd { get; set; }
    
    [Required]
    public DateTime RenewalDate { get; set; }
    
    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal AnnualFee { get; set; }
    
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
    
    public bool AutoRenew { get; set; } = true;
    
    public DateTime? CancellationDate { get; set; }

    public string? CancellationReason { get; set; }

    [ForeignKey("CancelledByUser")]
    public int? CancelledBy { get; set; }

    // Suspension fields
    public DateTime? SuspensionDate { get; set; }

    public string? SuspensionReason { get; set; }

    [ForeignKey("SuspendedByUser")]
    public int? SuspendedBy { get; set; }

    public int RenewalCount { get; set; } = 0;
    
    public DateTime? LastPaymentDate { get; set; }
    
    public DateTime? NextPaymentDueDate { get; set; }
    
    [Column(TypeName = "json")]
    public string? CustomFields { get; set; }
    
    [ForeignKey("CreatedByUser")]
    public int? CreatedBy { get; set; }
    
    // Navigation Properties
    public Customer Customer { get; set; } = null!;
    public Order Order { get; set; } = null!;
    public ProductVariant ProductVariant { get; set; } = null!;
    public User? CancelledByUser { get; set; }
    public User? SuspendedByUser { get; set; }
    public User? CreatedByUser { get; set; }
    public ICollection<SubscriptionHistory> History { get; set; } = new List<SubscriptionHistory>();
}

public enum SubscriptionStatus
{
    Active,
    Expired,
    Cancelled,
    Suspended,
    PendingRenewal
}
