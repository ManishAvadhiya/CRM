using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
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

            // Generate access + refresh tokens
            var token = _jwtHelper.GenerateAccessToken(user);
            var refreshToken = _jwtHelper.GenerateRefreshToken(user);
            SetAccessTokenCookie(token);
            SetRefreshTokenCookie(refreshToken);

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

    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> RefreshToken()
    {
        try
        {
            if (!Request.Cookies.TryGetValue("refresh_token", out var refreshToken) || string.IsNullOrWhiteSpace(refreshToken))
            {
                return Unauthorized(ApiResponse<LoginResponseDto>.ErrorResponse("Refresh token is missing"));
            }

            var principal = _jwtHelper.ValidateRefreshToken(refreshToken);
            if (principal == null)
            {
                return Unauthorized(ApiResponse<LoginResponseDto>.ErrorResponse("Invalid refresh token"));
            }

            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse<LoginResponseDto>.ErrorResponse("Invalid refresh token payload"));
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId && u.IsActive);
            if (user == null)
            {
                return Unauthorized(ApiResponse<LoginResponseDto>.ErrorResponse("User no longer active"));
            }

            var accessToken = _jwtHelper.GenerateAccessToken(user);
            var newRefreshToken = _jwtHelper.GenerateRefreshToken(user);
            SetAccessTokenCookie(accessToken);
            SetRefreshTokenCookie(newRefreshToken);

            var response = new LoginResponseDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role.ToString(),
                Token = accessToken
            };

            return Ok(ApiResponse<LoginResponseDto>.SuccessResponse(response, "Token refreshed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Refresh token error: {ex.Message}");
            return StatusCode(500, ApiResponse<LoginResponseDto>.ErrorResponse("An error occurred while refreshing token"));
        }
    }

    [HttpPost("logout")]
    public ActionResult<ApiResponse<bool>> Logout()
    {
        ClearAccessTokenCookie();
        ClearRefreshTokenCookie();
        return Ok(ApiResponse<bool>.SuccessResponse(true, "Logged out successfully"));
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

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var isHttps = Request.IsHttps;
        var sameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax;
        var refreshExpiryMinutes = int.Parse(HttpContext.RequestServices.GetRequiredService<IConfiguration>()
            .GetSection("JwtSettings")["RefreshExpiryMinutes"] ?? "10080");

        Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = sameSite,
            Expires = DateTimeOffset.UtcNow.AddMinutes(refreshExpiryMinutes),
            Path = "/"
        });
    }

    private void SetAccessTokenCookie(string accessToken)
    {
        var isHttps = Request.IsHttps;
        var sameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax;
        var accessExpiryMinutes = int.Parse(HttpContext.RequestServices.GetRequiredService<IConfiguration>()
            .GetSection("JwtSettings")["ExpiryMinutes"] ?? "1440");

        Response.Cookies.Append("access_token", accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = sameSite,
            Expires = DateTimeOffset.UtcNow.AddMinutes(accessExpiryMinutes),
            Path = "/"
        });
    }

    private void ClearRefreshTokenCookie()
    {
        var isHttps = Request.IsHttps;
        var sameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax;

        Response.Cookies.Append("refresh_token", string.Empty, new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = sameSite,
            Expires = DateTimeOffset.UtcNow.AddDays(-1),
            Path = "/"
        });
    }

    private void ClearAccessTokenCookie()
    {
        var isHttps = Request.IsHttps;
        var sameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax;

        Response.Cookies.Append("access_token", string.Empty, new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = sameSite,
            Expires = DateTimeOffset.UtcNow.AddDays(-1),
            Path = "/"
        });
    }
}
