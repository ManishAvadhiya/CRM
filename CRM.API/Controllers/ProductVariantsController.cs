using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.DTOs;
using CRM.API.Models;

namespace CRM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductVariantsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductVariantsController> _logger;

    public ProductVariantsController(ApplicationDbContext context, ILogger<ProductVariantsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ProductVariant>>>> GetAll([FromQuery] bool activeOnly = true)
    {
        try
        {
            var query = _context.ProductVariants.AsQueryable();

            if (activeOnly)
            {
                query = query.Where(p => p.IsActive);
            }

            var variants = await query
                .OrderBy(p => p.DisplayOrder)
                .ToListAsync();

            return Ok(ApiResponse<List<ProductVariant>>.SuccessResponse(variants));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching product variants: {ex.Message}");
            return StatusCode(500, ApiResponse<List<ProductVariant>>.ErrorResponse("Error fetching product variants"));
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ProductVariant>>> GetById(int id)
    {
        try
        {
            var variant = await _context.ProductVariants.FindAsync(id);

            if (variant == null)
            {
                return NotFound(ApiResponse<ProductVariant>.ErrorResponse("Product variant not found"));
            }

            return Ok(ApiResponse<ProductVariant>.SuccessResponse(variant));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching product variant: {ex.Message}");
            return StatusCode(500, ApiResponse<ProductVariant>.ErrorResponse("Error fetching product variant"));
        }
    }
}
