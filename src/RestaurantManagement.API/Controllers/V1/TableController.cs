using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.Table;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class TableController : ControllerBase
{
    private readonly ITableService _tableService;

    public TableController(ITableService tableService)
    {
        _tableService = tableService;
    }

    [HttpGet]
    [Authorize(Policy = Permissions.TableView)]
    [ProducesResponseType(typeof(ApiResponse<List<TableDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTables(CancellationToken cancellationToken)
    {
        var result = await _tableService.GetTablesAsync(cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.TableCreate)]
    [ProducesResponseType(typeof(ApiResponse<TableDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTable([FromBody] CreateTableDto dto, CancellationToken cancellationToken)
    {
        var result = await _tableService.CreateTableAsync(dto, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Permissions.TableUpdate)]
    [ProducesResponseType(typeof(ApiResponse<TableDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTable(Guid id, [FromBody] CreateTableDto dto, CancellationToken cancellationToken)
    {
        var result = await _tableService.UpdateTableAsync(id, dto, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = Permissions.TableUpdate)]
    [ProducesResponseType(typeof(ApiResponse<TableDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTableStatusDto dto, CancellationToken cancellationToken)
    {
        var result = await _tableService.UpdateStatusAsync(id, dto, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("{id:guid}/assign/{orderId:guid}")]
    [Authorize(Policy = Permissions.TableUpdate)]
    [ProducesResponseType(typeof(ApiResponse<TableDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignTable(Guid id, Guid orderId, CancellationToken cancellationToken)
    {
        var result = await _tableService.AssignAsync(id, orderId, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("{id:guid}/free")]
    [Authorize(Policy = Permissions.TableUpdate)]
    [ProducesResponseType(typeof(ApiResponse<TableDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> FreeTable(Guid id, CancellationToken cancellationToken)
    {
        var result = await _tableService.FreeAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("{id:guid}/qr-code")]
    [Authorize(Policy = Permissions.TableView)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQRCode(Guid id, CancellationToken cancellationToken)
    {
        var result = await _tableService.GetQRCodeAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("reservations")]
    [Authorize(Policy = Permissions.TableView)]
    [ProducesResponseType(typeof(ApiResponse<List<TableReservationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReservations([FromQuery] DateOnly? date, CancellationToken cancellationToken)
    {
        var result = await _tableService.GetReservationsAsync(date, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("reservations")]
    [Authorize(Policy = Permissions.TableCreate)]
    [ProducesResponseType(typeof(ApiResponse<TableReservationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateReservation([FromBody] CreateReservationDto dto, CancellationToken cancellationToken)
    {
        var result = await _tableService.CreateReservationAsync(dto, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }
}
