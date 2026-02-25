using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.DTOs;
using CRM.API.Models;
using CRM.API.Helpers;
using CRM.API.Services;
using BCrypt.Net;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly JwtHelper _jwtHelper;
    private readonly IOtpService _otpService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(ApplicationDbContext context, JwtHelper jwtHelper, IOtpService otpService, ILogger<AuthController> logger)
    {
        _context = context;
        _jwtHelper = jwtHelper;
        _otpService = otpService;
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

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse<ForgotPasswordResponseDto>>> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

            if (user == null)
            {
                return BadRequest(ApiResponse<ForgotPasswordResponseDto>.ErrorResponse("User not found"));
            }

            // Only Marketing and Partner users can reset password via OTP
            if (user.Role == UserRole.ManagementAdmin)
            {
                return BadRequest(ApiResponse<ForgotPasswordResponseDto>.ErrorResponse("Management Admin password reset not allowed via OTP"));
            }

            var message = await _otpService.GenerateAndSendOtpAsync(request.Email);

            var response = new ForgotPasswordResponseDto
            {
                Message = message,
                Email = request.Email
            };

            _logger.LogInformation($"OTP sent to {request.Email}");
            return Ok(ApiResponse<ForgotPasswordResponseDto>.SuccessResponse(response, "OTP sent to your email"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Forgot password error: {ex.Message}");
            return StatusCode(500, ApiResponse<ForgotPasswordResponseDto>.ErrorResponse("An error occurred"));
        }
    }

    [HttpPost("verify-otp")]
    public async Task<ActionResult<ApiResponse<VerifyOtpResponseDto>>> VerifyOtp([FromBody] VerifyOtpRequestDto request)
    {
        try
        {
            var isValid = await _otpService.IsOtpValidAsync(request.Email, request.Otp);

            var response = new VerifyOtpResponseDto
            {
                IsValid = isValid,
                Message = isValid ? "OTP is valid" : "OTP is invalid or expired"
            };

            if (!isValid)
                return BadRequest(ApiResponse<VerifyOtpResponseDto>.ErrorResponse("Invalid or expired OTP"));

            return Ok(ApiResponse<VerifyOtpResponseDto>.SuccessResponse(response, "OTP verified successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"OTP verification error: {ex.Message}");
            return StatusCode(500, ApiResponse<VerifyOtpResponseDto>.ErrorResponse("An error occurred"));
        }
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse<ResetPasswordResponseDto>>> ResetPassword([FromBody] ResetPasswordRequestDto request)
    {
        try
        {
            // Verify OTP
            var isOtpValid = await _otpService.VerifyOtpAsync(request.Email, request.Otp);
            if (!isOtpValid)
            {
                return BadRequest(ApiResponse<ResetPasswordResponseDto>.ErrorResponse("Invalid or expired OTP"));
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

            if (user == null)
            {
                return BadRequest(ApiResponse<ResetPasswordResponseDto>.ErrorResponse("User not found"));
            }

            // Hash new password
            var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordHash = newPasswordHash;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var response = new ResetPasswordResponseDto
            {
                Success = true,
                Message = "Password reset successfully"
            };

            _logger.LogInformation($"Password reset for user {user.Email}");
            return Ok(ApiResponse<ResetPasswordResponseDto>.SuccessResponse(response, "Password reset successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Reset password error: {ex.Message}");
            return StatusCode(500, ApiResponse<ResetPasswordResponseDto>.ErrorResponse("An error occurred during password reset"));
        }
    }
}
