using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRM.API.Models;

public class ProductVariant : BaseEntity
{
    [Key]
    public int VariantId { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string VariantName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string VariantCode { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal BasePriceSingleUser { get; set; }
    
    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal BasePriceMultiUser { get; set; }
    
    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal AnnualSubscriptionFee { get; set; }
    
    [Column(TypeName = "json")]
    public string? Features { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public int DisplayOrder { get; set; } = 0;
    
    [ForeignKey("CreatedByUser")]
    public int? CreatedBy { get; set; }
    
    // Navigation Properties
    public User? CreatedByUser { get; set; }
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}
