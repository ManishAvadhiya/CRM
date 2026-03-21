using System.Security.Claims;
using CRM.API.Data;
using CRM.API.DTOs;
using CRM.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ActivitiesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ActivitiesController> _logger;

    public ActivitiesController(ApplicationDbContext context, ILogger<ActivitiesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ActivityListItemDto>>>> GetAll(
        [FromQuery] RelatedToType? relatedToType = null,
        [FromQuery] int? relatedToId = null,
        [FromQuery] ActivityType? type = null)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var query = _context.Activities
                .Include(a => a.CreatedByUser)
                .AsQueryable();

            if (userRole == "Partner")
            {
                query = query.Where(a => a.CreatedBy == currentUserId);
            }

            if (relatedToType.HasValue)
            {
                query = query.Where(a => a.RelatedToType == relatedToType.Value);
            }

            if (relatedToId.HasValue)
            {
                query = query.Where(a => a.RelatedToId == relatedToId.Value);
            }

            if (type.HasValue)
            {
                query = query.Where(a => a.ActivityType == type.Value);
            }

            var activities = await query
                .OrderByDescending(a => a.ActivityDate)
                .ToListAsync();

            var leadIds = activities
                .Where(a => a.RelatedToType == RelatedToType.Lead)
                .Select(a => a.RelatedToId)
                .Distinct()
                .ToList();

            var customerIds = activities
                .Where(a => a.RelatedToType == RelatedToType.Customer)
                .Select(a => a.RelatedToId)
                .Distinct()
                .ToList();

            var leadNames = leadIds.Count == 0
                ? new Dictionary<int, string>()
                : await _context.Leads
                    .Where(l => leadIds.Contains(l.LeadId))
                    .Select(l => new { l.LeadId, Name = l.CompanyName })
                    .ToDictionaryAsync(x => x.LeadId, x => x.Name);

            var customerNames = customerIds.Count == 0
                ? new Dictionary<int, string>()
                : await _context.Customers
                    .Where(c => customerIds.Contains(c.CustomerId))
                    .Select(c => new { c.CustomerId, Name = c.CompanyName })
                    .ToDictionaryAsync(x => x.CustomerId, x => x.Name);

            string ResolveName(Activity activity)
            {
                return activity.RelatedToType switch
                {
                    RelatedToType.Lead => leadNames.TryGetValue(activity.RelatedToId, out var leadName)
                        ? leadName
                        : "Lead",
                    RelatedToType.Customer => customerNames.TryGetValue(activity.RelatedToId, out var customerName)
                        ? customerName
                        : "Customer",
                    _ => activity.RelatedToType.ToString()
                };
            }

            var data = activities
                .Select(a => new ActivityListItemDto
                {
                    ActivityId = a.ActivityId,
                    Name = ResolveName(a),
                    Type = a.ActivityType,
                    Description = a.Description,
                    Outcome = a.Outcome,
                    Date = a.ActivityDate,
                    NextFollowUp = a.DueDate,
                    CreatedBy = a.CreatedByUser?.Name ?? "Unknown",
                    RelatedToType = a.RelatedToType,
                    RelatedToId = a.RelatedToId
                })
                .ToList();

            return Ok(ApiResponse<List<ActivityListItemDto>>.SuccessResponse(data));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching activities");
            return StatusCode(500, ApiResponse<List<ActivityListItemDto>>.ErrorResponse("Error fetching activities"));
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Activity>>> GetById(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var activity = await _context.Activities
                .Include(a => a.CreatedByUser)
                .Include(a => a.AssignedToUser)
                .FirstOrDefaultAsync(a => a.ActivityId == id);

            if (activity == null)
            {
                return NotFound(ApiResponse<Activity>.ErrorResponse("Activity not found"));
            }

            if (userRole == "Partner" && activity.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            return Ok(ApiResponse<Activity>.SuccessResponse(activity));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching activity");
            return StatusCode(500, ApiResponse<Activity>.ErrorResponse("Error fetching activity"));
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Activity>>> Create([FromBody] CreateActivityDto request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            if (userRole != "ManagementAdmin" && userRole != "Marketing" && userRole != "Partner")
            {
                return Forbid();
            }

            if (request.RelatedToType != RelatedToType.Lead && request.RelatedToType != RelatedToType.Customer)
            {
                return BadRequest(ApiResponse<Activity>.ErrorResponse("Activities can only be linked to Lead or Customer"));
            }

            var accessAllowed = await HasAccessToRelatedEntity(request.RelatedToType, request.RelatedToId, currentUserId, userRole);
            if (!accessAllowed)
            {
                return Forbid();
            }

            var activity = new Activity
            {
                ActivityType = request.ActivityType,
                Subject = request.Subject,
                Description = request.Description,
                RelatedToType = request.RelatedToType,
                RelatedToId = request.RelatedToId,
                ActivityDate = request.ActivityDate,
                DueDate = request.DueDate,
                Status = request.Status,
                Priority = request.Priority,
                Duration = request.Duration,
                Location = request.Location,
                Outcome = request.Outcome,
                AssignedTo = request.AssignedTo,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Activities.Add(activity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = activity.ActivityId }, ApiResponse<Activity>.SuccessResponse(activity, "Activity created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating activity");
            return StatusCode(500, ApiResponse<Activity>.ErrorResponse("Error creating activity"));
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<Activity>>> Update(int id, [FromBody] UpdateActivityDto request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var activity = await _context.Activities.FirstOrDefaultAsync(a => a.ActivityId == id);
            if (activity == null)
            {
                return NotFound(ApiResponse<Activity>.ErrorResponse("Activity not found"));
            }

            if (userRole == "Partner" && activity.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            activity.ActivityType = request.ActivityType;
            activity.Subject = request.Subject;
            activity.Description = request.Description;
            activity.ActivityDate = request.ActivityDate;
            activity.DueDate = request.DueDate;
            activity.Status = request.Status;
            activity.Priority = request.Priority;
            activity.Duration = request.Duration;
            activity.Location = request.Location;
            activity.Outcome = request.Outcome;
            activity.AssignedTo = request.AssignedTo;

            if (request.Status == ActivityStatus.Completed)
            {
                activity.CompletedBy = currentUserId;
                activity.CompletedAt = DateTime.UtcNow;
            }

            activity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(ApiResponse<Activity>.SuccessResponse(activity, "Activity updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating activity");
            return StatusCode(500, ApiResponse<Activity>.ErrorResponse("Error updating activity"));
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var activity = await _context.Activities.FirstOrDefaultAsync(a => a.ActivityId == id);
            if (activity == null)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("Activity not found"));
            }

            if (userRole == "Partner" && activity.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            activity.IsDeleted = true;
            activity.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.SuccessResponse(true, "Activity deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting activity");
            return StatusCode(500, ApiResponse<bool>.ErrorResponse("Error deleting activity"));
        }
    }

    private async Task<bool> HasAccessToRelatedEntity(RelatedToType relatedToType, int relatedToId, int currentUserId, string userRole)
    {
        if (userRole != "Partner")
        {
            return relatedToType switch
            {
                RelatedToType.Lead => await _context.Leads.AnyAsync(l => l.LeadId == relatedToId),
                RelatedToType.Customer => await _context.Customers.AnyAsync(c => c.CustomerId == relatedToId),
                _ => false
            };
        }

        return relatedToType switch
        {
            RelatedToType.Lead => await _context.Leads.AnyAsync(l => l.LeadId == relatedToId && l.CreatedBy == currentUserId),
            RelatedToType.Customer => await _context.Customers.AnyAsync(c => c.CustomerId == relatedToId && c.CreatedBy == currentUserId),
            _ => false
        };
    }
}