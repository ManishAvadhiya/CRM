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
            var query = _context.Leads
                .Include(l => l.AssignedToUser)
                .AsQueryable();

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
            var lead = await _context.Leads
                .Include(l => l.AssignedToUser)
                .Include(l => l.ConvertedCustomer)
                .FirstOrDefaultAsync(l => l.LeadId == id);

            if (lead == null)
            {
                return NotFound(ApiResponse<Lead>.ErrorResponse("Lead not found"));
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
            lead.CreatedBy = GetCurrentUserId();
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

            _logger.LogInformation($"Lead created: {lead.LeadId}");

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
            var lead = await _context.Leads.FindAsync(id);
            
            if (lead == null)
            {
                return NotFound(ApiResponse<Lead>.ErrorResponse("Lead not found"));
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

            _logger.LogInformation($"Lead updated: {lead.LeadId}");

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
}
