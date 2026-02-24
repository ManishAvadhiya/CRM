using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRM.API.Models;

public class Activity : BaseEntity
{
    [Key]
    public int ActivityId { get; set; }
    
    [Required]
    public ActivityType ActivityType { get; set; }
    
    [MaxLength(200)]
    public string? Subject { get; set; }
    
    public string? Description { get; set; }
    
    [Required]
    public RelatedToType RelatedToType { get; set; }
    
    [Required]
    public int RelatedToId { get; set; }
    
    [Required]
    public DateTime ActivityDate { get; set; }
    
    public DateTime? DueDate { get; set; }
    
    public ActivityStatus Status { get; set; } = ActivityStatus.Planned;
    
    public ActivityPriority Priority { get; set; } = ActivityPriority.Medium;
    
    public int? Duration { get; set; }
    
    [MaxLength(255)]
    public string? Location { get; set; }
    
    public string? Outcome { get; set; }
    
    [ForeignKey("AssignedToUser")]
    public int? AssignedTo { get; set; }
    
    [Required]
    [ForeignKey("CreatedByUser")]
    public int CreatedBy { get; set; }
    
    [ForeignKey("CompletedByUser")]
    public int? CompletedBy { get; set; }
    
    public DateTime? CompletedAt { get; set; }
    
    [Column(TypeName = "json")]
    public string? CustomFields { get; set; }
    
    // Navigation Properties
    public User? AssignedToUser { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public User? CompletedByUser { get; set; }
}

public enum ActivityType
{
    Call,
    Meeting,
    Email,
    Task,
    Note
}

public enum RelatedToType
{
    Lead,
    Customer,
    Order,
    Subscription
}

public enum ActivityStatus
{
    Planned,
    InProgress,
    Completed,
    Cancelled
}

public enum ActivityPriority
{
    Low,
    Medium,
    High,
    Urgent
}
