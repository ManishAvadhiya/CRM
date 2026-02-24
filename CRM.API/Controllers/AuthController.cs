using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.DTOs;
using CRM.API.Models;
using CRM.API.Helpers;
using BCrypt.Net;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly JwtHelper _jwtHelper;
    private readonly ILogger<AuthController> _logger;

    public AuthController(ApplicationDbContext context, JwtHelper jwtHelper, ILogger<AuthController> logger)
    {
        _context = context;
        _jwtHelper = jwtHelper;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

            if (user == null)
            {
                return BadRequest(ApiResponse<LoginResponseDto>.ErrorResponse("Invalid email or password"));
            }

            // Verify password
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            
            if (!isPasswordValid)
            {
                return BadRequest(ApiResponse<LoginResponseDto>.ErrorResponse("Invalid email or password"));
            }

            // Update last login
            user.LastLogin = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Generate JWT token
            var token = _jwtHelper.GenerateToken(user);

            var response = new LoginResponseDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role.ToString(),
                Token = token
            };

            _logger.LogInformation($"User {user.Email} logged in successfully");

            return Ok(ApiResponse<LoginResponseDto>.SuccessResponse(response, "Login successful"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Login error: {ex.Message}");
            return StatusCode(500, ApiResponse<LoginResponseDto>.ErrorResponse("An error occurred during login"));
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Register([FromBody] RegisterRequestDto request)
    {
        try
        {
            // Check if email already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
            {
                return BadRequest(ApiResponse<LoginResponseDto>.ErrorResponse("Email already registered"));
            }

            // Hash password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Parse role
            if (!Enum.TryParse<UserRole>(request.Role, out var userRole))
            {
                userRole = UserRole.SalesPerson;
            }

            var user = new User
            {
                Name = request.Name,
                Email = request.Email,
                PasswordHash = passwordHash,
                Role = userRole,
                Phone = request.Phone,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Generate JWT token
            var token = _jwtHelper.GenerateToken(user);

            var response = new LoginResponseDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role.ToString(),
                Token = token
            };

            _logger.LogInformation($"User {user.Email} registered successfully");

            return Ok(ApiResponse<LoginResponseDto>.SuccessResponse(response, "Registration successful"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Registration error: {ex.Message}");
            return StatusCode(500, ApiResponse<LoginResponseDto>.ErrorResponse("An error occurred during registration"));
        }
    }
}
