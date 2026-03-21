using CRM.API.Models;

namespace CRM.API.DTOs;

public class ActivityListItemDto
{
    public int ActivityId { get; set; }
    public string Name { get; set; } = string.Empty;
    public ActivityType Type { get; set; }
    public string? Description { get; set; }
    public string? Outcome { get; set; }
    public DateTime Date { get; set; }
    public DateTime? NextFollowUp { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public RelatedToType RelatedToType { get; set; }
    public int RelatedToId { get; set; }
}

public class CreateActivityDto
{
    public ActivityType ActivityType { get; set; }
    public string? Subject { get; set; }
    public string? Description { get; set; }
    public RelatedToType RelatedToType { get; set; }
    public int RelatedToId { get; set; }
    public DateTime ActivityDate { get; set; }
    public DateTime? DueDate { get; set; }
    public ActivityStatus Status { get; set; } = ActivityStatus.Planned;
    public ActivityPriority Priority { get; set; } = ActivityPriority.Medium;
    public int? Duration { get; set; }
    public string? Location { get; set; }
    public string? Outcome { get; set; }
    public int? AssignedTo { get; set; }
}

public class UpdateActivityDto
{
    public ActivityType ActivityType { get; set; }
    public string? Subject { get; set; }
    public string? Description { get; set; }
    public DateTime ActivityDate { get; set; }
    public DateTime? DueDate { get; set; }
    public ActivityStatus Status { get; set; }
    public ActivityPriority Priority { get; set; }
    public int? Duration { get; set; }
    public string? Location { get; set; }
    public string? Outcome { get; set; }
    public int? AssignedTo { get; set; }
}