using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRM.API.Models;

public class Lead : BaseEntity
{
    [Key]
    public int LeadId { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string CompanyName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string ContactName { get; set; } = string.Empty;
    
    [EmailAddress]
    [MaxLength(100)]
    public string? Email { get; set; }
    
    [MaxLength(20)]
    public string? Phone { get; set; }
    
    [MaxLength(255)]
    public string? Website { get; set; }
    
    [MaxLength(100)]
    public string? Industry { get; set; }
    
    public LeadSource? LeadSource { get; set; }
    
    public LeadStatus Status { get; set; } = LeadStatus.New;
    
    public LeadRating? Rating { get; set; }
    
    [ForeignKey("AssignedToUser")]
    public int? AssignedTo { get; set; }
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal? EstimatedValue { get; set; }
    
    public DateTime? ExpectedCloseDate { get; set; }
    
    public string? Notes { get; set; }
    
    [ForeignKey("ConvertedCustomer")]
    public int? ConvertedToCustomerId { get; set; }
    
    public DateTime? ConvertedDate { get; set; }
    
    public string? LostReason { get; set; }
    
    [Column(TypeName = "json")]
    public string? CustomFields { get; set; }
    
    [ForeignKey("CreatedByUser")]
    public int? CreatedBy { get; set; }
    
    // Navigation Properties
    public User? AssignedToUser { get; set; }
    public User? CreatedByUser { get; set; }
    public Customer? ConvertedCustomer { get; set; }
}

public enum LeadSource
{
    Website,
    Referral,
    ColdCall,
    Campaign,
    SocialMedia,
    Other
}

public enum LeadStatus
{
    New,
    Demo,
    Converted,
    Lost
}

public enum LeadRating
{
    Hot,
    Warm,
    Cold
}
