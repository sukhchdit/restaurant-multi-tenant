using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RestaurantManagement.API.Hubs;
using RestaurantManagement.Application.DTOs.Billing;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billingService;
    private readonly IHubContext<OrderHub> _orderHub;

    public BillingController(IBillingService billingService, IHubContext<OrderHub> orderHub)
    {
        _billingService = billingService;
        _orderHub = orderHub;
    }

    private async Task BroadcastAsync(string eventName)
    {
        var tenantId = User.FindFirst("tenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantId))
            await _orderHub.Clients.Group($"tenant_{tenantId}").SendAsync(eventName);
    }

    [HttpGet("invoices")]
    [Authorize(Policy = Permissions.BillingView)]
    [ProducesResponseType(typeof(ApiResponse<List<InvoiceDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInvoices(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _billingService.GetInvoicesAsync(pageNumber, pageSize, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("invoices/{orderId:guid}")]
    [Authorize(Policy = Permissions.BillingCreate)]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateInvoice(Guid orderId, CancellationToken cancellationToken)
    {
        var result = await _billingService.GenerateInvoiceAsync(orderId, cancellationToken);
        if (result.Success) await BroadcastAsync("BillingUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("invoices/{invoiceId:guid}/pdf")]
    [Authorize(Policy = Permissions.BillingExport)]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInvoicePdf(Guid invoiceId, CancellationToken cancellationToken)
    {
        var result = await _billingService.GetInvoicePdfAsync(invoiceId, cancellationToken);

        if (!result.Success)
            return StatusCode(result.StatusCode, ApiResponse.Fail(result.Message, result.StatusCode));

        return File(result.Data!, "application/pdf", $"invoice-{invoiceId}.pdf");
    }

    [HttpPost("invoices/{invoiceId:guid}/email")]
    [Authorize(Policy = Permissions.BillingExport)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EmailInvoice(Guid invoiceId, [FromQuery] string email, CancellationToken cancellationToken)
    {
        var result = await _billingService.EmailInvoiceAsync(invoiceId, email, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }
}
