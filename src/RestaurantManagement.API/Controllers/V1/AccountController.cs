using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RestaurantManagement.API.Hubs;
using RestaurantManagement.Application.DTOs.Account;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/accounts")]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly IAccountService _accountService;
    private readonly IHubContext<OrderHub> _orderHub;

    public AccountController(IAccountService accountService, IHubContext<OrderHub> orderHub)
    {
        _accountService = accountService;
        _orderHub = orderHub;
    }

    private async Task BroadcastAsync(string eventName)
    {
        var tenantId = User.FindFirst("tenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantId))
            await _orderHub.Clients.Group($"tenant_{tenantId}").SendAsync(eventName);
    }

    [HttpGet("ledger")]
    [Authorize(Policy = Permissions.BillingView)]
    [ProducesResponseType(typeof(ApiResponse<List<LedgerEntryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLedger(
        [FromQuery] string? type = null,
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _accountService.GetLedgerAsync(type, dateFrom, dateTo, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("ledger")]
    [Authorize(Policy = Permissions.BillingCreate)]
    [ProducesResponseType(typeof(ApiResponse<LedgerEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateLedgerEntry([FromBody] CreateLedgerEntryDto dto, CancellationToken cancellationToken)
    {
        var result = await _accountService.CreateLedgerEntryAsync(dto, cancellationToken);
        if (result.Success) await BroadcastAsync("BillingUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("settlements")]
    [Authorize(Policy = Permissions.BillingView)]
    [ProducesResponseType(typeof(ApiResponse<List<DailySettlementDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettlements(CancellationToken cancellationToken)
    {
        var result = await _accountService.GetSettlementsAsync(cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("settlements")]
    [Authorize(Policy = Permissions.BillingCreate)]
    [ProducesResponseType(typeof(ApiResponse<DailySettlementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SettleDay([FromBody] SettleDayRequest request, CancellationToken cancellationToken)
    {
        var result = await _accountService.SettleDayAsync(request.Date, cancellationToken);
        if (result.Success) await BroadcastAsync("BillingUpdated");
        return StatusCode(result.StatusCode, result);
    }
}

public class SettleDayRequest
{
    public string Date { get; set; } = string.Empty;
}
