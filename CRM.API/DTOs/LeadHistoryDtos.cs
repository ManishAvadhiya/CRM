using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs;

public class AddLeadNoteRequestDto
{
    [Required]
    [MaxLength(2000)]
    public string Note { get; set; } = string.Empty;

    /// <summary>
    /// Optional: Additional description/context for the note
    /// </summary>
    [MaxLength(2000)]
    public string? Description { get; set; }
}

public class UpdateLeadStatusRequestDto
{
    [Required]
    public string Status { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class LeadHistoryDto
{
    public int HistoryId { get; set; }
    public int LeadId { get; set; }
    public int ChangedByUserId { get; set; }
    public string ChangedByUserName { get; set; } = string.Empty;
    public string ChangeType { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? Description { get; set; }
    public DateTime ChangedAt { get; set; }
}

public class LeadDetailResponseDto
{
    public int LeadId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? Industry { get; set; }
    public string? LeadSource { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Rating { get; set; }
    public int? AssignedTo { get; set; }
    public string? AssignedToName { get; set; }
    public decimal? EstimatedValue { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
    public int? ConvertedToCustomerId { get; set; }
    public DateTime? ConvertedDate { get; set; }
    public string? LostReason { get; set; }
    public int? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<LeadHistoryDto> History { get; set; } = new();
}
