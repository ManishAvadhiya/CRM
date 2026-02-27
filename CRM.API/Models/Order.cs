using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRM.API.Models;

public class Order : BaseEntity
{
    [Key]
    public int OrderId { get; set; }
    
    [MaxLength(50)]
    public string OrderNumber { get; set; } = string.Empty;
    
    [Required]
    [ForeignKey("Customer")]
    public int CustomerId { get; set; }
    
    [Required]
    [ForeignKey("ProductVariant")]
    public int VariantId { get; set; }
    
    // User Type Selection
    public UserLicenseType UserLicenseType { get; set; } = UserLicenseType.SingleUser;
    
    public int Quantity { get; set; } = 1;
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal BasePrice { get; set; }
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal BaseAmount { get; set; }
    
    public string? CustomizationDetails { get; set; }
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal CustomizationAmount { get; set; } = 0;
    
    [Column(TypeName = "decimal(5,2)")]
    public decimal DiscountPercent { get; set; } = 0;
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal DiscountAmount { get; set; } = 0;
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal SubTotal { get; set; }
    
    [Column(TypeName = "decimal(5,2)")]
    public decimal TaxPercent { get; set; } = 18;
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal TaxAmount { get; set; } = 0;
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal TotalAmount { get; set; }
    
    [Required]
    public DateTime OrderDate { get; set; }
    
    public DateTime? ExpectedDeliveryDate { get; set; }
    
    public DateTime? ActualDeliveryDate { get; set; }
    
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    
    public string? PaymentTerms { get; set; }
    
    public string? Notes { get; set; }
    
    [Column(TypeName = "json")]
    public string? CustomFields { get; set; }
    
    [Required]
    [ForeignKey("CreatedByUser")]
    public int CreatedBy { get; set; }
    
    // Navigation Properties
    public Customer? Customer { get; set; }
    public ProductVariant? ProductVariant { get; set; }
    public User? CreatedByUser { get; set; }
    public Subscription? Subscription { get; set; }
}

public enum UserLicenseType
{
    SingleUser,
    MultiUser
}

public enum OrderStatus
{
    Draft,
    Pending,
    Confirmed,
    Delivered,
    Cancelled
}

public enum PaymentStatus
{
    Pending,
    Partial,
    Paid
}
