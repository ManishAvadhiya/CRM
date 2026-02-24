using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRM.API.Models;

public class Customer : BaseEntity
{
    [Key]
    public int CustomerId { get; set; }
    
    [ForeignKey("Lead")]
    public int? LeadId { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string CompanyName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string ContactPerson { get; set; } = string.Empty;
    
    [EmailAddress]
    [MaxLength(100)]
    public string? Email { get; set; }
    
    [MaxLength(20)]
    public string? Phone { get; set; }
    
    [MaxLength(20)]
    public string? AlternatePhone { get; set; }
    
    [MaxLength(255)]
    public string? Website { get; set; }
    
    [MaxLength(100)]
    public string? Industry { get; set; }
    
    public CustomerType CustomerType { get; set; } = CustomerType.Business;
    
    // Billing Address
    public string? BillingAddress { get; set; }
    
    [MaxLength(100)]
    public string? BillingCity { get; set; }
    
    [MaxLength(100)]
    public string? BillingState { get; set; }
    
    [MaxLength(100)]
    public string? BillingCountry { get; set; } = "India";
    
    [MaxLength(20)]
    public string? BillingPostalCode { get; set; }
    
    // Shipping Address
    public string? ShippingAddress { get; set; }
    
    [MaxLength(100)]
    public string? ShippingCity { get; set; }
    
    [MaxLength(100)]
    public string? ShippingState { get; set; }
    
    [MaxLength(100)]
    public string? ShippingCountry { get; set; } = "India";
    
    [MaxLength(20)]
    public string? ShippingPostalCode { get; set; }
    
    // Tax Details
    [MaxLength(50)]
    public string? GSTNumber { get; set; }
    
    [MaxLength(50)]
    public string? PANNumber { get; set; }
    
    [ForeignKey("AccountOwnerUser")]
    public int? AccountOwner { get; set; }
    
    [Column(TypeName = "json")]
    public string? CustomFields { get; set; }
    
    [ForeignKey("CreatedByUser")]
    public int? CreatedBy { get; set; }
    
    // Navigation Properties
    public Lead? Lead { get; set; }
    public User? AccountOwnerUser { get; set; }
    public User? CreatedByUser { get; set; }
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}

public enum CustomerType
{
    Individual,
    Business
}
