using CRM.API.Data;
using CRM.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Services;

public interface IOtpService
{
    Task<string> GenerateAndSendOtpAsync(string email);
    Task<bool> VerifyOtpAsync(string email, string otp);
    Task<bool> IsOtpValidAsync(string email, string otp);
    Task DeleteExpiredOtpsAsync();
}

public class OtpService : IOtpService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<OtpService> _logger;
    private const int OTP_VALIDITY_MINUTES = 10;

    public OtpService(ApplicationDbContext context, IEmailService emailService, ILogger<OtpService> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// Generates a 6-digit OTP and sends it to user email
    /// </summary>
    public async Task<string> GenerateAndSendOtpAsync(string email)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
            if (user == null)
            {
                _logger.LogWarning($"User not found for email: {email}");
                throw new InvalidOperationException("User not found");
            }

            // Generate 6-digit OTP
            var otp = GenerateOtp();
            var expiryTime = DateTime.UtcNow.AddMinutes(OTP_VALIDITY_MINUTES);

            // Delete previous OTPs for this user
            var existingOtps = _context.PasswordResets.Where(pr => pr.UserId == user.UserId && !pr.IsUsed);
            _context.PasswordResets.RemoveRange(existingOtps);

            // Create new OTP record
            var passwordReset = new PasswordReset
            {
                UserId = user.UserId,
                Otp = otp,
                OtpExpiryTime = expiryTime,
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PasswordResets.Add(passwordReset);
            await _context.SaveChangesAsync();

            // Send OTP email
            var subject = "Your CRM Password Reset OTP";
            var body = $@"
                <h2>Password Reset Request</h2>
                <p>Hello {user.Name},</p>
                <p>Your One-Time Password (OTP) for password reset is:</p>
                <h3 style='color: #4CAF50;'>{otp}</h3>
                <p>This OTP is valid for {OTP_VALIDITY_MINUTES} minutes only.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <p>Best regards,<br/>CRM System</p>
            ";

            await _emailService.SendEmailAsync(email, subject, body);
            _logger.LogInformation($"OTP sent successfully to {email}");

            return "OTP sent to your email";
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error generating OTP: {ex.Message}");
            throw;
        }
    }

    /// <summary>
    /// Verifies OTP and marks it as used
    /// </summary>
    public async Task<bool> VerifyOtpAsync(string email, string otp)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
            if (user == null)
                return false;

            var passwordReset = await _context.PasswordResets
                .FirstOrDefaultAsync(pr => pr.UserId == user.UserId && 
                                          pr.Otp == otp && 
                                          !pr.IsUsed && 
                                          pr.OtpExpiryTime > DateTime.UtcNow);

            if (passwordReset == null)
            {
                _logger.LogWarning($"Invalid or expired OTP for email: {email}");
                return false;
            }

            // Mark as used
            passwordReset.IsUsed = true;
            _context.PasswordResets.Update(passwordReset);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"OTP verified successfully for {email}");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error verifying OTP: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Validates OTP without marking as used (for checking validity)
    /// </summary>
    public async Task<bool> IsOtpValidAsync(string email, string otp)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
            if (user == null)
                return false;

            var passwordReset = await _context.PasswordResets
                .FirstOrDefaultAsync(pr => pr.UserId == user.UserId && 
                                          pr.Otp == otp && 
                                          !pr.IsUsed && 
                                          pr.OtpExpiryTime > DateTime.UtcNow);

            return passwordReset != null;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error validating OTP: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Deletes expired OTPs
    /// </summary>
    public async Task DeleteExpiredOtpsAsync()
    {
        try
        {
            var expiredOtps = _context.PasswordResets.Where(pr => pr.OtpExpiryTime < DateTime.UtcNow);
            _context.PasswordResets.RemoveRange(expiredOtps);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Expired OTPs deleted");
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error deleting expired OTPs: {ex.Message}");
        }
    }

    private string GenerateOtp()
    {
        var random = new Random();
        var otp = random.Next(100000, 999999).ToString();
        return otp;
    }
}
