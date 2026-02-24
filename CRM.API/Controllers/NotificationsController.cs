using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CRM.API.DTOs;
using CRM.API.Models;
using CRM.API.Services;
using System.Security.Claims;

namespace CRM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(INotificationService notificationService, ILogger<NotificationsController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<Notification>>>> GetMyNotifications([FromQuery] bool unreadOnly = false)
    {
        try
        {
            var userId = GetCurrentUserId();
            var notifications = await _notificationService.GetUserNotificationsAsync(userId, unreadOnly);

            return Ok(ApiResponse<List<Notification>>.SuccessResponse(notifications));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching notifications: {ex.Message}");
            return StatusCode(500, ApiResponse<List<Notification>>.ErrorResponse("Error fetching notifications"));
        }
    }

    [HttpPut("{id}/mark-read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsRead(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _notificationService.MarkAsReadAsync(id, userId);

            if (!result)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("Notification not found"));
            }

            return Ok(ApiResponse<bool>.SuccessResponse(true, "Notification marked as read"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error marking notification as read: {ex.Message}");
            return StatusCode(500, ApiResponse<bool>.ErrorResponse("Error marking notification as read"));
        }
    }

    [HttpPut("mark-all-read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAllAsRead()
    {
        try
        {
            var userId = GetCurrentUserId();
            await _notificationService.MarkAllAsReadAsync(userId);

            return Ok(ApiResponse<bool>.SuccessResponse(true, "All notifications marked as read"));
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error marking all notifications as read: {ex.Message}");
            return StatusCode(500, ApiResponse<bool>.ErrorResponse("Error marking all notifications as read"));
        }
    }
}
