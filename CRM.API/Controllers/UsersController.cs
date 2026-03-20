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
    public async Task<ActionResult<ApiResponse<List<UserListDto>>>> GetAllUsers()
    {
        try
        {
            var users = await _context.Users
                .Where(u => !u.IsDeleted)
                .Select(u => new UserListDto
                {
                    UserId = u.UserId,
                    Name = u.Name,
                    Email = u.Email,
                    Role = u.Role.ToString(),
                    Phone = u.Phone,
                    IsActive = u.IsActive,
                    LastLogin = u.LastLogin,
                    CreatedAt = u.CreatedAt
                })
                .OrderByDescending(u => u.UserId)
                .ToListAsync();
            
            return Ok(ApiResponse<List<UserListDto>>.SuccessResponse(users, "Users retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching users: {ex.Message}");
            return StatusCode(500, ApiResponse<List<UserListDto>>.ErrorResponse("An error occurred while fetching users"));
        }
    }

    /// <summary>
    /// Create a Marketing user (ManagementAdmin only)
    /// </summary>
    [Authorize(Roles = "ManagementAdmin")]
    [HttpPost("create-marketing")]
    public async Task<ActionResult<ApiResponse<CreateUserWithCredentialsDto>>> CreateMarketingUser([FromBody] CreateMarketingUserRequestDto request)
    {
        try
        {
            // Check if email already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
            {
                return BadRequest(ApiResponse<CreateUserWithCredentialsDto>.ErrorResponse("Email already exists"));
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

            var response = new CreateUserWithCredentialsDto
            {
                UserId = newUser.UserId,
                Name = newUser.Name,
                Email = newUser.Email,
                LoginId = newUser.Email,
                Password = request.Password, // Return plain password only during creation
                Role = newUser.Role.ToString(),
                Message = "Marketing user created successfully. Share login credentials with the user."
            };

            _logger.LogInformation($"Marketing user created: {newUser.Email} by admin {currentUserId}");
            return Ok(ApiResponse<CreateUserWithCredentialsDto>.SuccessResponse(response, "Marketing user created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error creating marketing user: {ex.Message}");
            return StatusCode(500, ApiResponse<CreateUserWithCredentialsDto>.ErrorResponse("An error occurred while creating user"));
        }
    }

    /// <summary>
    /// Get Partner users created by the current Marketing user
    /// </summary>
    [Authorize(Roles = "Marketing")]
    [HttpGet("my-partners")]
    public async Task<ActionResult<ApiResponse<List<UserListDto>>>> GetMyPartners()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var partners = await _context.Users
                .Where(u => u.CreatedByUserId == currentUserId && u.Role == UserRole.Partner && !u.IsDeleted)
                .Select(u => new UserListDto
                {
                    UserId = u.UserId,
                    Name = u.Name,
                    Email = u.Email,
                    Role = u.Role.ToString(),
                    Phone = u.Phone,
                    IsActive = u.IsActive,
                    LastLogin = u.LastLogin,
                    CreatedAt = u.CreatedAt
                })
                .OrderByDescending(u => u.UserId)
                .ToListAsync();
            
            return Ok(ApiResponse<List<UserListDto>>.SuccessResponse(partners, "Partners retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching partners: {ex.Message}");
            return StatusCode(500, ApiResponse<List<UserListDto>>.ErrorResponse("An error occurred while fetching partners"));
        }
    }

    /// <summary>
    /// Create a Partner user (Marketing and ManagementAdmin)
    /// </summary>
    [Authorize(Roles = "Marketing,ManagementAdmin")]
    [HttpPost("create-partner")]
    public async Task<ActionResult<ApiResponse<CreateUserWithCredentialsDto>>> CreatePartnerUser([FromBody] CreatePartnerUserRequestDto request)
    {
        try
        {
            // Check if email already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
            {
                return BadRequest(ApiResponse<CreateUserWithCredentialsDto>.ErrorResponse("Email already exists"));
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

            var response = new CreateUserWithCredentialsDto
            {
                UserId = newUser.UserId,
                Name = newUser.Name,
                Email = newUser.Email,
                LoginId = newUser.Email,
                Password = request.Password, // Return plain password only during creation
                Role = newUser.Role.ToString(),
                Message = "Partner user created successfully. Share login credentials with the partner."
            };

            var userRole = GetCurrentUserRole();
            _logger.LogInformation($"Partner user created: {newUser.Email} by {userRole} {currentUserId}");
            return Ok(ApiResponse<CreateUserWithCredentialsDto>.SuccessResponse(response, "Partner user created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error creating partner user: {ex.Message}");
            return StatusCode(500, ApiResponse<CreateUserWithCredentialsDto>.ErrorResponse("An error occurred while creating user"));
        }
    }

    /// <summary>
    /// Disable a user (ManagementAdmin can disable any user, Marketing can disable their own partners)
    /// </summary>
    [Authorize(Roles = "ManagementAdmin,Marketing")]
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

            // Check authorization: ManagementAdmin can disable anyone, Marketing can only disable their partners
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();
            if (currentUserRole == "Marketing" && user.CreatedByUserId != currentUserId)
            {
                return Forbid();
            }

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"User {user.Email} disabled");
            return Ok(ApiResponse<string>.SuccessResponse("User disabled successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error disabling user: {ex.Message}");
            return StatusCode(500, ApiResponse<string>.ErrorResponse("An error occurred"));
        }
    }

    /// <summary>
    /// Enable a user (ManagementAdmin can enable any user, Marketing can enable their own partners)
    /// </summary>
    [Authorize(Roles = "ManagementAdmin,Marketing")]
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

            // Check authorization: ManagementAdmin can enable anyone, Marketing can only enable their partners
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();
            if (currentUserRole == "Marketing" && user.CreatedByUserId != currentUserId)
            {
                return Forbid();
            }

            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"User {user.Email} enabled");
            return Ok(ApiResponse<string>.SuccessResponse("User enabled successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error enabling user: {ex.Message}");
            return StatusCode(500, ApiResponse<string>.ErrorResponse("An error occurred"));
        }
    }

    /// <summary>
    /// Update a user (ManagementAdmin can update any user, Marketing can update their own partners)
    /// </summary>
    [Authorize(Roles = "ManagementAdmin,Marketing")]
    [HttpPut("{userId}")]
    public async Task<ActionResult<ApiResponse<UserListDto>>> UpdateUser(int userId, [FromBody] UpdateUserRequestDto request)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse<UserListDto>.ErrorResponse("User not found"));
            }

            // Check authorization: ManagementAdmin can update anyone, Marketing can only update their partners
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();
            
            if (currentUserRole == "Marketing" && user.CreatedByUserId != currentUserId)
            {
                return Forbid();
            }

            // Check if email is already taken by another user
            var emailExists = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.UserId != userId);
            
            if (emailExists != null)
            {
                return BadRequest(ApiResponse<UserListDto>.ErrorResponse("Email already exists"));
            }

            user.Name = request.Name;
            user.Email = request.Email;
            user.Phone = request.Phone;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var response = new UserListDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role.ToString(),
                Phone = user.Phone,
                IsActive = user.IsActive,
                LastLogin = user.LastLogin,
                CreatedAt = user.CreatedAt
            };

            _logger.LogInformation($"User {user.Email} (ID: {userId}) updated");
            return Ok(ApiResponse<UserListDto>.SuccessResponse(response, "User updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error updating user: {ex.Message}");
            return StatusCode(500, ApiResponse<UserListDto>.ErrorResponse("An error occurred while updating user"));
        }
    }

    /// <summary>
    /// Delete a user (soft delete - ManagementAdmin can delete any user, Marketing can delete their own partners)
    /// </summary>
    [Authorize(Roles = "ManagementAdmin,Marketing")]
    [HttpDelete("{userId}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteUser(int userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse<string>.ErrorResponse("User not found"));
            }

            // Prevent deletion of self
            var currentUserId = GetCurrentUserId();
            if (user.UserId == currentUserId)
            {
                return BadRequest(ApiResponse<string>.ErrorResponse("Cannot delete your own account"));
            }

            // Check authorization: ManagementAdmin can delete anyone, Marketing can only delete their partners
            var currentUserRole = GetCurrentUserRole();
            if (currentUserRole == "Marketing" && user.CreatedByUserId != currentUserId)
            {
                return Forbid();
            }

            // Soft delete
            user.IsDeleted = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"User {user.Email} deleted");
            return Ok(ApiResponse<string>.SuccessResponse("User deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error deleting user: {ex.Message}");
            return StatusCode(500, ApiResponse<string>.ErrorResponse("An error occurred while deleting user"));
        }
    }

    /// <summary>
    /// Get current logged-in user profile
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetCurrentUserProfile()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(currentUserId);

            if (user == null)
            {
                return NotFound(ApiResponse<UserProfileDto>.ErrorResponse("User not found"));
            }

            var profile = new UserProfileDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role.ToString(),
                Phone = user.Phone,
                ProfileImage = user.ProfileImage,
                IsActive = user.IsActive,
                LastLogin = user.LastLogin,
                CreatedAt = user.CreatedAt
            };

            return Ok(ApiResponse<UserProfileDto>.SuccessResponse(profile));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching user profile: {ex.Message}");
            return StatusCode(500, ApiResponse<UserProfileDto>.ErrorResponse("An error occurred"));
        }
    }

    /// <summary>
    /// Change password for current user
    /// </summary>
    [HttpPost("change-password")]
    public async Task<ActionResult<ApiResponse<ChangePasswordResponseDto>>> ChangePassword([FromBody] ChangePasswordRequestDto request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(currentUserId);

            if (user == null)
            {
                return NotFound(ApiResponse<ChangePasswordResponseDto>.ErrorResponse("User not found"));
            }

            // Verify current password
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(ApiResponse<ChangePasswordResponseDto>.ErrorResponse("Current password is incorrect"));
            }

            // Hash new password
            var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordHash = newPasswordHash;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var response = new ChangePasswordResponseDto
            {
                Success = true,
                Message = "Password changed successfully"
            };

            _logger.LogInformation($"Password changed for user {user.Email}");
            return Ok(ApiResponse<ChangePasswordResponseDto>.SuccessResponse(response, "Password changed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error changing password: {ex.Message}");
            return StatusCode(500, ApiResponse<ChangePasswordResponseDto>.ErrorResponse("An error occurred while changing password"));
        }
    }
}
