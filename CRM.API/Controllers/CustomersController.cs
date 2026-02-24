using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.DTOs;
using CRM.API.Models;
using System.Security.Claims;

namespace CRM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(ApplicationDbContext context, ILogger<CustomersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<Customer>>>> GetAll()
    {
        try
        {
            var customers = await _context.Customers
                .Include(c => c.AccountOwnerUser)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<List<Customer>>.SuccessResponse(customers));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching customers: {ex.Message}");
            return StatusCode(500, ApiResponse<List<Customer>>.ErrorResponse("Error fetching customers"));
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Customer>>> GetById(int id)
    {
        try
        {
            var customer = await _context.Customers
                .Include(c => c.Lead)
                .Include(c => c.AccountOwnerUser)
                .Include(c => c.Orders)
                .Include(c => c.Subscriptions)
                .FirstOrDefaultAsync(c => c.CustomerId == id);

            if (customer == null)
            {
                return NotFound(ApiResponse<Customer>.ErrorResponse("Customer not found"));
            }

            return Ok(ApiResponse<Customer>.SuccessResponse(customer));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching customer: {ex.Message}");
            return StatusCode(500, ApiResponse<Customer>.ErrorResponse("Error fetching customer"));
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Customer>>> Create([FromBody] Customer customer)
    {
        try
        {
            customer.CreatedBy = GetCurrentUserId();
            customer.CreatedAt = DateTime.UtcNow;

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Customer created: {customer.CustomerId}");

            return CreatedAtAction(nameof(GetById), new { id = customer.CustomerId }, 
                ApiResponse<Customer>.SuccessResponse(customer, "Customer created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error creating customer: {ex.Message}");
            return StatusCode(500, ApiResponse<Customer>.ErrorResponse("Error creating customer"));
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<Customer>>> Update(int id, [FromBody] Customer updatedCustomer)
    {
        try
        {
            var customer = await _context.Customers.FindAsync(id);
            
            if (customer == null)
            {
                return NotFound(ApiResponse<Customer>.ErrorResponse("Customer not found"));
            }

            // Update properties
            customer.CompanyName = updatedCustomer.CompanyName;
            customer.ContactPerson = updatedCustomer.ContactPerson;
            customer.Email = updatedCustomer.Email;
            customer.Phone = updatedCustomer.Phone;
            customer.AlternatePhone = updatedCustomer.AlternatePhone;
            customer.Website = updatedCustomer.Website;
            customer.Industry = updatedCustomer.Industry;
            customer.CustomerType = updatedCustomer.CustomerType;
            customer.BillingAddress = updatedCustomer.BillingAddress;
            customer.BillingCity = updatedCustomer.BillingCity;
            customer.BillingState = updatedCustomer.BillingState;
            customer.BillingCountry = updatedCustomer.BillingCountry;
            customer.BillingPostalCode = updatedCustomer.BillingPostalCode;
            customer.ShippingAddress = updatedCustomer.ShippingAddress;
            customer.ShippingCity = updatedCustomer.ShippingCity;
            customer.ShippingState = updatedCustomer.ShippingState;
            customer.ShippingCountry = updatedCustomer.ShippingCountry;
            customer.ShippingPostalCode = updatedCustomer.ShippingPostalCode;
            customer.GSTNumber = updatedCustomer.GSTNumber;
            customer.PANNumber = updatedCustomer.PANNumber;
            customer.AccountOwner = updatedCustomer.AccountOwner;
            customer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Customer updated: {customer.CustomerId}");

            return Ok(ApiResponse<Customer>.SuccessResponse(customer, "Customer updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error updating customer: {ex.Message}");
            return StatusCode(500, ApiResponse<Customer>.ErrorResponse("Error updating customer"));
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var customer = await _context.Customers.FindAsync(id);
            
            if (customer == null)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("Customer not found"));
            }

            // Soft delete
            customer.IsDeleted = true;
            customer.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Customer deleted: {customer.CustomerId}");

            return Ok(ApiResponse<bool>.SuccessResponse(true, "Customer deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error deleting customer: {ex.Message}");
            return StatusCode(500, ApiResponse<bool>.ErrorResponse("Error deleting customer"));
        }
    }
}
