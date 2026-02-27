using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.DTOs;
using CRM.API.Models;
using System.Security.Claims;
using CRM.API.Services;

namespace CRM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LeadsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<LeadsController> _logger;

    public LeadsController(ApplicationDbContext context, INotificationService notificationService, ILogger<LeadsController> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<Lead>>>> GetAll([FromQuery] string? status = null)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            var query = _context.Leads
                .Include(l => l.AssignedToUser)
                .Include(l => l.CreatedByUser)
                .AsQueryable();

            // Role-based visibility
            if (userRole == "Partner")
            {
                // Partners can only see their own leads
                query = query.Where(l => l.CreatedBy == currentUserId);
            }
            // ManagementAdmin and Marketing can see all leads

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<LeadStatus>(status, out var leadStatus))
            {
                query = query.Where(l => l.Status == leadStatus);
            }

            var leads = await query
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<List<Lead>>.SuccessResponse(leads));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching leads: {ex.Message}");
            return StatusCode(500, ApiResponse<List<Lead>>.ErrorResponse("Error fetching leads"));
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Lead>>> GetById(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            var lead = await _context.Leads
                .Include(l => l.AssignedToUser)
                .Include(l => l.ConvertedCustomer)
                .Include(l => l.CreatedByUser)
                .FirstOrDefaultAsync(l => l.LeadId == id);

            if (lead == null)
            {
                return NotFound(ApiResponse<Lead>.ErrorResponse("Lead not found"));
            }

            // Check visibility for Partner - they can only see their own leads
            if (userRole == "Partner" && lead.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            return Ok(ApiResponse<Lead>.SuccessResponse(lead));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching lead: {ex.Message}");
            return StatusCode(500, ApiResponse<Lead>.ErrorResponse("Error fetching lead"));
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Lead>>> Create([FromBody] Lead lead)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            // Only Marketing, ManagementAdmin, and Partner can create leads
            if (userRole != "Marketing" && userRole != "ManagementAdmin" && userRole != "Partner")
            {
                return Forbid();
            }

            lead.CreatedBy = currentUserId;
            lead.CreatedAt = DateTime.UtcNow;

            _context.Leads.Add(lead);
            await _context.SaveChangesAsync();

            // Send notification if lead is assigned
            if (lead.AssignedTo.HasValue)
            {
                await _notificationService.CreateNotificationAsync(
                    lead.AssignedTo.Value,
                    NotificationType.LeadAssigned,
                    "New Lead Assigned",
                    $"You have been assigned a new lead: {lead.CompanyName}",
                    RelatedToType.Lead,
                    lead.LeadId,
                    sendEmail: true
                );
            }

            _logger.LogInformation($"Lead created by {userRole} user {currentUserId}: {lead.LeadId}");

            return CreatedAtAction(nameof(GetById), new { id = lead.LeadId }, 
                ApiResponse<Lead>.SuccessResponse(lead, "Lead created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error creating lead: {ex.Message}");
            return StatusCode(500, ApiResponse<Lead>.ErrorResponse("Error creating lead"));
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<Lead>>> Update(int id, [FromBody] Lead updatedLead)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            var lead = await _context.Leads.FindAsync(id);
            
            if (lead == null)
            {
                return NotFound(ApiResponse<Lead>.ErrorResponse("Lead not found"));
            }

            // Role-based update restrictions
            // Partners can only update their own leads
            if (userRole == "Partner" && lead.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            // Update properties
            lead.CompanyName = updatedLead.CompanyName;
            lead.ContactName = updatedLead.ContactName;
            lead.Email = updatedLead.Email;
            lead.Phone = updatedLead.Phone;
            lead.Website = updatedLead.Website;
            lead.Industry = updatedLead.Industry;
            lead.LeadSource = updatedLead.LeadSource;
            lead.Status = updatedLead.Status;
            lead.Rating = updatedLead.Rating;
            lead.AssignedTo = updatedLead.AssignedTo;
            lead.EstimatedValue = updatedLead.EstimatedValue;
            lead.ExpectedCloseDate = updatedLead.ExpectedCloseDate;
            lead.Notes = updatedLead.Notes;
            lead.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Lead {id} updated by {userRole} user {currentUserId}");

            return Ok(ApiResponse<Lead>.SuccessResponse(lead, "Lead updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error updating lead: {ex.Message}");
            return StatusCode(500, ApiResponse<Lead>.ErrorResponse("Error updating lead"));
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var lead = await _context.Leads.FindAsync(id);
            
            if (lead == null)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("Lead not found"));
            }

            // Soft delete
            lead.IsDeleted = true;
            lead.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Lead deleted: {lead.LeadId}");

            return Ok(ApiResponse<bool>.SuccessResponse(true, "Lead deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error deleting lead: {ex.Message}");
            return StatusCode(500, ApiResponse<bool>.ErrorResponse("Error deleting lead"));
        }
    }

    [HttpPost("{id}/convert")]
    public async Task<ActionResult<ApiResponse<Customer>>> ConvertToCustomer(int id)
    {
        try
        {
            var lead = await _context.Leads.FindAsync(id);
            
            if (lead == null)
            {
                return NotFound(ApiResponse<Customer>.ErrorResponse("Lead not found"));
            }

            if (lead.Status == LeadStatus.Converted)
            {
                return BadRequest(ApiResponse<Customer>.ErrorResponse("Lead already converted"));
            }

            // Create customer from lead
            var customer = new Customer
            {
                LeadId = lead.LeadId,
                CompanyName = lead.CompanyName,
                ContactPerson = lead.ContactName,
                Email = lead.Email,
                Phone = lead.Phone,
                Website = lead.Website,
                Industry = lead.Industry,
                AccountOwner = lead.AssignedTo,
                CreatedBy = GetCurrentUserId(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            
            // Update lead status after customer is saved (so CustomerId is generated)
            lead.Status = LeadStatus.Converted;
            lead.ConvertedToCustomerId = customer.CustomerId;
            lead.ConvertedDate = DateTime.UtcNow;
            lead.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Send notification
            if (lead.AssignedTo.HasValue)
            {
                await _notificationService.CreateNotificationAsync(
                    lead.AssignedTo.Value,
                    NotificationType.LeadConverted,
                    "Lead Converted",
                    $"Lead {lead.CompanyName} has been converted to a customer",
                    RelatedToType.Customer,
                    customer.CustomerId,
                    sendEmail: true
                );
            }

            _logger.LogInformation($"Lead {lead.LeadId} converted to customer {customer.CustomerId}");

            return Ok(ApiResponse<Customer>.SuccessResponse(customer, "Lead converted to customer successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error converting lead: {ex.Message}");
            return StatusCode(500, ApiResponse<Customer>.ErrorResponse("Error converting lead"));
        }
    }

    /// <summary>
    /// Get lead with complete history
    /// </summary>
    [HttpGet("{id}/with-history")]
    public async Task<ActionResult<ApiResponse<LeadDetailResponseDto>>> GetWithHistory(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            var lead = await _context.Leads
                .Include(l => l.AssignedToUser)
                .Include(l => l.CreatedByUser)
                .FirstOrDefaultAsync(l => l.LeadId == id);

            if (lead == null)
            {
                return NotFound(ApiResponse<LeadDetailResponseDto>.ErrorResponse("Lead not found"));
            }

            // Check visibility for Partner
            if (userRole == "Partner" && lead.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            // Get complete history
            var history = await _context.LeadHistories
                .Where(lh => lh.LeadId == id)
                .Include(lh => lh.ChangedByUser)
                .OrderByDescending(lh => lh.ChangedAt)
                .Select(lh => new LeadHistoryDto
                {
                    HistoryId = lh.HistoryId,
                    LeadId = lh.LeadId,
                    ChangedByUserId = lh.ChangedByUserId,
                    ChangedByUserName = lh.ChangedByUser!.Name,
                    ChangeType = lh.ChangeType,
                    OldValue = lh.OldValue,
                    NewValue = lh.NewValue,
                    Description = lh.Description,
                    ChangedAt = lh.ChangedAt
                })
                .ToListAsync();

            var response = new LeadDetailResponseDto
            {
                LeadId = lead.LeadId,
                CompanyName = lead.CompanyName,
                ContactName = lead.ContactName,
                Email = lead.Email,
                Phone = lead.Phone,
                Website = lead.Website,
                Industry = lead.Industry,
                LeadSource = lead.LeadSource?.ToString(),
                Status = lead.Status.ToString(),
                Rating = lead.Rating?.ToString(),
                AssignedTo = lead.AssignedTo,
                AssignedToName = lead.AssignedToUser?.Name,
                EstimatedValue = lead.EstimatedValue,
                ExpectedCloseDate = lead.ExpectedCloseDate,
                Notes = lead.Notes,
                ConvertedToCustomerId = lead.ConvertedToCustomerId,
                ConvertedDate = lead.ConvertedDate,
                LostReason = lead.LostReason,
                CreatedBy = lead.CreatedBy,
                CreatedByName = lead.CreatedByUser?.Name,
                CreatedAt = lead.CreatedAt,
                UpdatedAt = lead.UpdatedAt,
                History = history
            };

            return Ok(ApiResponse<LeadDetailResponseDto>.SuccessResponse(response));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching lead with history: {ex.Message}");
            return StatusCode(500, ApiResponse<LeadDetailResponseDto>.ErrorResponse("Error fetching lead"));
        }
    }

    /// <summary>
    /// Add a note/detail to lead (without changing status)
    /// </summary>
    [HttpPost("{id}/add-note")]
    public async Task<ActionResult<ApiResponse<LeadHistoryDto>>> AddNote(int id, [FromBody] AddLeadNoteRequestDto request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            var lead = await _context.Leads.FindAsync(id);
            if (lead == null)
            {
                return NotFound(ApiResponse<LeadHistoryDto>.ErrorResponse("Lead not found"));
            }

            // Check permission for Partner
            if (userRole == "Partner" && lead.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            // Create history entry for note
            var history = new LeadHistory
            {
                LeadId = id,
                ChangedByUserId = currentUserId,
                ChangeType = "NoteAdded",
                Description = request.Note,
                ChangedAt = DateTime.UtcNow
            };

            _context.LeadHistories.Add(history);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(currentUserId);
            var historyDto = new LeadHistoryDto
            {
                HistoryId = history.HistoryId,
                LeadId = history.LeadId,
                ChangedByUserId = history.ChangedByUserId,
                ChangedByUserName = user?.Name ?? "Unknown",
                ChangeType = history.ChangeType,
                Description = history.Description,
                ChangedAt = history.ChangedAt
            };

            _logger.LogInformation($"Note added to lead {id} by user {currentUserId}");
            return Ok(ApiResponse<LeadHistoryDto>.SuccessResponse(historyDto, "Note added successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error adding note to lead: {ex.Message}");
            return StatusCode(500, ApiResponse<LeadHistoryDto>.ErrorResponse("Error adding note"));
        }
    }

    /// <summary>
    /// Update lead status and create history entry
    /// </summary>
    [HttpPut("{id}/update-status")]
    public async Task<ActionResult<ApiResponse<LeadHistoryDto>>> UpdateStatus(int id, [FromBody] UpdateLeadStatusRequestDto request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            var lead = await _context.Leads.FindAsync(id);
            if (lead == null)
            {
                return NotFound(ApiResponse<LeadHistoryDto>.ErrorResponse("Lead not found"));
            }

            // Check permission for Partner 
            if (userRole == "Partner" && lead.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            if (!Enum.TryParse<LeadStatus>(request.Status, out var newStatus))
            {
                return BadRequest(ApiResponse<LeadHistoryDto>.ErrorResponse("Invalid lead status"));
            }

            var oldStatus = lead.Status.ToString();
            lead.Status = newStatus;
            lead.UpdatedAt = DateTime.UtcNow;

            // Create history entry
            var history = new LeadHistory
            {
                LeadId = id,
                ChangedByUserId = currentUserId,
                ChangeType = "StatusChanged",
                OldValue = oldStatus,
                NewValue = request.Status,
                Description = request.Notes,
                ChangedAt = DateTime.UtcNow
            };

            _context.LeadHistories.Add(history);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(currentUserId);
            var historyDto = new LeadHistoryDto
            {
                HistoryId = history.HistoryId,
                LeadId = history.LeadId,
                ChangedByUserId = history.ChangedByUserId,
                ChangedByUserName = user?.Name ?? "Unknown",
                ChangeType = history.ChangeType,
                OldValue = history.OldValue,
                NewValue = history.NewValue,
                Description = history.Description,
                ChangedAt = history.ChangedAt
            };

            _logger.LogInformation($"Lead {id} status changed from {oldStatus} to {newStatus} by user {currentUserId}");
            return Ok(ApiResponse<LeadHistoryDto>.SuccessResponse(historyDto, "Lead status updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error updating lead status: {ex.Message}");
            return StatusCode(500, ApiResponse<LeadHistoryDto>.ErrorResponse("Error updating lead status"));
        }
    }

    /// <summary>
    /// Get lead history timeline
    /// </summary>
    [HttpGet("{id}/history")]
    public async Task<ActionResult<ApiResponse<List<LeadHistoryDto>>>> GetHistory(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            var lead = await _context.Leads.FindAsync(id);
            if (lead == null)
            {
                return NotFound(ApiResponse<List<LeadHistoryDto>>.ErrorResponse("Lead not found"));
            }

            // Check visibility for Partner
            if (userRole == "Partner" && lead.CreatedBy != currentUserId)
            {
                return Forbid();
            }

            var history = await _context.LeadHistories
                .Where(lh => lh.LeadId == id)
                .Include(lh => lh.ChangedByUser)
                .OrderByDescending(lh => lh.ChangedAt)
                .Select(lh => new LeadHistoryDto
                {
                    HistoryId = lh.HistoryId,
                    LeadId = lh.LeadId,
                    ChangedByUserId = lh.ChangedByUserId,
                    ChangedByUserName = lh.ChangedByUser!.Name,
                    ChangeType = lh.ChangeType,
                    OldValue = lh.OldValue,
                    NewValue = lh.NewValue,
                    Description = lh.Description,
                    ChangedAt = lh.ChangedAt
                })
                .ToListAsync();

            return Ok(ApiResponse<List<LeadHistoryDto>>.SuccessResponse(history));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching lead history: {ex.Message}");
            return StatusCode(500, ApiResponse<List<LeadHistoryDto>>.ErrorResponse("Error fetching history"));
        }
    }
}
