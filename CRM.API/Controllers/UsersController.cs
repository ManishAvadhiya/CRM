using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.DTOs;
using CRM.API.Models;
using System.Security.Claims;
using BCrypt.Net;

namespace CRM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UsersController> _logger;

    public UsersController(ApplicationDbContext context, ILogger<UsersController> logger)
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

    /// <summary>
    /// Get all users (ManagementAdmin only)
    /// </summary>
    [Authorize(Roles = "ManagementAdmin")]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CreateUserResponseDto>>>> GetAllUsers()
    {
        try
        {
            var users = await _context.Users
                .Where(u => !u.IsDeleted)
                .Select(u => new CreateUserResponseDto
                {
                    UserId = u.UserId,
                    Name = u.Name,
                    Email = u.Email,
                    Role = u.Role.ToString(),
                    Message = string.Empty
                })
                .OrderByDescending(u => u.UserId)
                .ToListAsync();

            return Ok(ApiResponse<List<CreateUserResponseDto>>.SuccessResponse(users, "Users retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching users: {ex.Message}");
            return StatusCode(500, ApiResponse<List<CreateUserResponseDto>>.ErrorResponse("An error occurred while fetching users"));
        }
    }

    /// <summary>
    /// Create a Marketing user (ManagementAdmin only)
    /// </summary>
    [Authorize(Roles = "ManagementAdmin")]
    [HttpPost("create-marketing")]
    public async Task<ActionResult<ApiResponse<CreateUserResponseDto>>> CreateMarketingUser([FromBody] CreateMarketingUserRequestDto request)
    {
        try
        {
            // Check if email already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
            {
                return BadRequest(ApiResponse<CreateUserResponseDto>.ErrorResponse("Email already exists"));
            }

            var currentUserId = GetCurrentUserId();
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var newUser = new User
            {
                Name = request.Name,
                Email = request.Email,
                PasswordHash = passwordHash,
                Role = UserRole.Marketing,
                Phone = request.Phone,
                IsActive = true,
                CreatedByUserId = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            var response = new CreateUserResponseDto
            {
                UserId = newUser.UserId,
                Name = newUser.Name,
                Email = newUser.Email,
                Role = newUser.Role.ToString(),
                Message = "Marketing user created successfully"
            };

            _logger.LogInformation($"Marketing user created: {newUser.Email} by admin {currentUserId}");
            return Ok(ApiResponse<CreateUserResponseDto>.SuccessResponse(response, "Marketing user created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error creating marketing user: {ex.Message}");
            return StatusCode(500, ApiResponse<CreateUserResponseDto>.ErrorResponse("An error occurred while creating user"));
        }
    }

    /// <summary>
    /// Create a Partner user (Marketing and ManagementAdmin)
    /// </summary>
    [Authorize(Roles = "Marketing,ManagementAdmin")]
    [HttpPost("create-partner")]
    public async Task<ActionResult<ApiResponse<CreateUserResponseDto>>> CreatePartnerUser([FromBody] CreatePartnerUserRequestDto request)
    {
        try
        {
            // Check if email already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
            {
                return BadRequest(ApiResponse<CreateUserResponseDto>.ErrorResponse("Email already exists"));
            }

            var currentUserId = GetCurrentUserId();
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var newUser = new User
            {
                Name = request.Name,
                Email = request.Email,
                PasswordHash = passwordHash,
                Role = UserRole.Partner,
                Phone = request.Phone,
                IsActive = true,
                CreatedByUserId = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            var response = new CreateUserResponseDto
            {
                UserId = newUser.UserId,
                Name = newUser.Name,
                Email = newUser.Email,
                Role = newUser.Role.ToString(),
                Message = "Partner user created successfully"
            };

            var userRole = GetCurrentUserRole();
            _logger.LogInformation($"Partner user created: {newUser.Email} by {userRole} {currentUserId}");
            return Ok(ApiResponse<CreateUserResponseDto>.SuccessResponse(response, "Partner user created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error creating partner user: {ex.Message}");
            return StatusCode(500, ApiResponse<CreateUserResponseDto>.ErrorResponse("An error occurred while creating user"));
        }
    }

    /// <summary>
    /// Disable a user (ManagementAdmin only)
    /// </summary>
    [Authorize(Roles = "ManagementAdmin")]
    [HttpPut("{userId}/disable")]
    public async Task<ActionResult<ApiResponse<string>>> DisableUser(int userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse<string>.ErrorResponse("User not found"));
            }

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"User {user.Email} disabled by admin");
            return Ok(ApiResponse<string>.SuccessResponse("User disabled successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error disabling user: {ex.Message}");
            return StatusCode(500, ApiResponse<string>.ErrorResponse("An error occurred"));
        }
    }

    /// <summary>
    /// Enable a user (ManagementAdmin only)
    /// </summary>
    [Authorize(Roles = "ManagementAdmin")]
    [HttpPut("{userId}/enable")]
    public async Task<ActionResult<ApiResponse<string>>> EnableUser(int userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse<string>.ErrorResponse("User not found"));
            }

            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"User {user.Email} enabled by admin");
            return Ok(ApiResponse<string>.SuccessResponse("User enabled successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error enabling user: {ex.Message}");
            return StatusCode(500, ApiResponse<string>.ErrorResponse("An error occurred"));
        }
    }
}
