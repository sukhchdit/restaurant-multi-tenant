using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RestaurantManagement.API.Hubs;
using RestaurantManagement.Application.DTOs.Staff;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;
    private readonly IHubContext<OrderHub> _orderHub;

    public StaffController(IStaffService staffService, IHubContext<OrderHub> orderHub)
    {
        _staffService = staffService;
        _orderHub = orderHub;
    }

    private async Task BroadcastAsync(string eventName)
    {
        var tenantId = User.FindFirst("tenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantId))
            await _orderHub.Clients.Group($"tenant_{tenantId}").SendAsync(eventName);
    }

    [HttpGet]
    [Authorize(Policy = Permissions.StaffView)]
    [ProducesResponseType(typeof(ApiResponse<List<StaffDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStaff(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _staffService.GetStaffAsync(pageNumber, pageSize, search, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.StaffCreate)]
    [ProducesResponseType(typeof(ApiResponse<StaffDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffDto dto, CancellationToken cancellationToken)
    {
        var result = await _staffService.CreateStaffAsync(dto, cancellationToken);
        if (result.Success) await BroadcastAsync("StaffUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Permissions.StaffUpdate)]
    [ProducesResponseType(typeof(ApiResponse<StaffDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStaff(Guid id, [FromBody] CreateStaffDto dto, CancellationToken cancellationToken)
    {
        var result = await _staffService.UpdateStaffAsync(id, dto, cancellationToken);
        if (result.Success) await BroadcastAsync("StaffUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Permissions.StaffDelete)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStaff(Guid id, CancellationToken cancellationToken)
    {
        var result = await _staffService.DeleteStaffAsync(id, cancellationToken);
        if (result.Success) await BroadcastAsync("StaffUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("{staffId:guid}/attendance")]
    [Authorize(Policy = Permissions.StaffView)]
    [ProducesResponseType(typeof(ApiResponse<List<AttendanceDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAttendance(
        Guid staffId,
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _staffService.GetAttendanceAsync(staffId, fromDate, toDate, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("{staffId:guid}/attendance/check-in")]
    [Authorize(Policy = Permissions.StaffUpdate)]
    [ProducesResponseType(typeof(ApiResponse<AttendanceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckIn(Guid staffId, CancellationToken cancellationToken)
    {
        var result = await _staffService.CheckInAsync(staffId, cancellationToken);
        if (result.Success) await BroadcastAsync("StaffUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("{staffId:guid}/attendance/check-out")]
    [Authorize(Policy = Permissions.StaffUpdate)]
    [ProducesResponseType(typeof(ApiResponse<AttendanceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckOut(Guid staffId, CancellationToken cancellationToken)
    {
        var result = await _staffService.CheckOutAsync(staffId, cancellationToken);
        if (result.Success) await BroadcastAsync("StaffUpdated");
        return StatusCode(result.StatusCode, result);
    }
}
