using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRM.API.Models;

public class LeadHistory : BaseEntity
{
    [Key]
    public int HistoryId { get; set; }

    [Required]
    [ForeignKey(nameof(Lead))]
    public int LeadId { get; set; }

    [Required]
    [ForeignKey(nameof(User))]
    public int ChangedByUserId { get; set; }

    /// <summary>
    /// Type of change: "Status", "Note", "Assignment", etc.
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string ChangeType { get; set; } = string.Empty;

    /// <summary>
    /// Previous value of the changed field
    /// </summary>
    [MaxLength(1000)]
    public string? OldValue { get; set; }

    /// <summary>
    /// New value of the changed field
    /// </summary>
    [MaxLength(1000)]
    public string? NewValue { get; set; }

    /// <summary>
    /// Description of the change (for notes/details added)
    /// </summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Lead? Lead { get; set; }
    public User? ChangedByUser { get; set; }
}

public enum HistoryChangeType
{
    StatusChanged,
    NoteAdded,
    AssignmentChanged,
    DetailsAdded,
    RatingChanged,
    ConvertedToCustomer,
    Other
}
