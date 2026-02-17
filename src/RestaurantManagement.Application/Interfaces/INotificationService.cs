using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.DTOs.Notification;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface INotificationService
{
    Task<ApiResponse<PaginatedResultDto<NotificationDto>>> GetNotificationsAsync(int pageNumber = 1, int pageSize = 20, bool? isRead = null, CancellationToken cancellationToken = default);
    Task<ApiResponse> MarkAsReadAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse> MarkAllAsReadAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<int>> GetUnreadCountAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<NotificationDto>> CreateAsync(Guid userId, string title, string message, NotificationType type, Guid? referenceId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
