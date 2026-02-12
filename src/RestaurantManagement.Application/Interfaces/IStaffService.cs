using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.DTOs.Staff;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface IStaffService
{
    Task<ApiResponse<PaginatedResultDto<StaffDto>>> GetStaffAsync(int pageNumber = 1, int pageSize = 20, string? search = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<StaffDto>> CreateStaffAsync(CreateStaffDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<StaffDto>> UpdateStaffAsync(Guid id, CreateStaffDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteStaffAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<AttendanceDto>>> GetAttendanceAsync(Guid staffId, DateOnly? fromDate = null, DateOnly? toDate = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<AttendanceDto>> CheckInAsync(Guid staffId, CancellationToken cancellationToken = default);
    Task<ApiResponse<AttendanceDto>> CheckOutAsync(Guid staffId, CancellationToken cancellationToken = default);
}
