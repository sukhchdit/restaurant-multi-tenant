using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RestaurantManagement.API.Hubs;
using RestaurantManagement.Application.DTOs.Payment;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/payments")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IHubContext<OrderHub> _orderHub;
    private readonly IBillingService _billingService;
    private readonly IAccountService _accountService;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(
        IPaymentService paymentService,
        IHubContext<OrderHub> orderHub,
        IBillingService billingService,
        IAccountService accountService,
        ILogger<PaymentController> logger)
    {
        _paymentService = paymentService;
        _orderHub = orderHub;
        _billingService = billingService;
        _accountService = accountService;
        _logger = logger;
    }

    private async Task BroadcastAsync(string eventName)
    {
        var tenantId = User.FindFirst("tenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantId))
            await _orderHub.Clients.Group($"tenant_{tenantId}").SendAsync(eventName);
    }

    [HttpGet]
    [Authorize(Policy = Permissions.PaymentView)]
    [ProducesResponseType(typeof(ApiResponse<List<PaymentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPayments(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? orderId = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _paymentService.GetPaymentsAsync(pageNumber, pageSize, orderId, search, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.PaymentProcess)]
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentDto dto, CancellationToken cancellationToken)
    {
        var result = await _paymentService.ProcessPaymentAsync(dto, cancellationToken);
        if (result.Success)
        {
            await BroadcastAsync("PaymentUpdated");

            try
            {
                // Auto-generate invoice for the order
                var invoiceResult = await _billingService.GenerateInvoiceAsync(dto.OrderId, cancellationToken);
                if (invoiceResult.Success)
                {
                    _logger.LogInformation("Auto-generated invoice for order {OrderId} on payment", dto.OrderId);
                    await BroadcastAsync("BillingUpdated");
                }
                else
                {
                    _logger.LogWarning("Auto-invoice returned failure for order {OrderId}: {Message}", dto.OrderId, invoiceResult.Message);
                }

                // Auto-create revenue ledger entry
                if (result.Data != null)
                {
                    await _accountService.CreateRevenueEntryAsync(
                        dto.OrderId, dto.Amount, dto.PaymentMethod.ToString(),
                        result.Data.OrderNumber ?? string.Empty, cancellationToken);
                    _logger.LogInformation("Auto-created ledger entry for order {OrderId}", dto.OrderId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Auto-invoice/ledger failed for order {OrderId} on payment", dto.OrderId);
            }
        }
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("split")]
    [Authorize(Policy = Permissions.PaymentProcess)]
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SplitPayment([FromBody] SplitPaymentDto dto, CancellationToken cancellationToken)
    {
        var totalSplitAmount = dto.Splits.Sum(s => s.Amount);
        var result = await _paymentService.SplitPaymentAsync(dto, cancellationToken);
        if (result.Success)
        {
            await BroadcastAsync("PaymentUpdated");

            try
            {
                // Auto-generate invoice for the order
                var invoiceResult = await _billingService.GenerateInvoiceAsync(dto.OrderId, cancellationToken);
                if (invoiceResult.Success)
                {
                    _logger.LogInformation("Auto-generated invoice for order {OrderId} on split payment", dto.OrderId);
                    await BroadcastAsync("BillingUpdated");
                }
                else
                {
                    _logger.LogWarning("Auto-invoice returned failure for order {OrderId}: {Message}", dto.OrderId, invoiceResult.Message);
                }

                // Auto-create revenue ledger entry
                if (result.Data != null)
                {
                    await _accountService.CreateRevenueEntryAsync(
                        dto.OrderId, totalSplitAmount, "Split",
                        result.Data.OrderNumber ?? string.Empty, cancellationToken);
                    _logger.LogInformation("Auto-created ledger entry for order {OrderId} on split payment", dto.OrderId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Auto-invoice/ledger failed for order {OrderId} on split payment", dto.OrderId);
            }
        }
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("refund")]
    [Authorize(Policy = Permissions.PaymentRefund)]
    [ProducesResponseType(typeof(ApiResponse<RefundResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ProcessRefund([FromBody] RefundDto dto, CancellationToken cancellationToken)
    {
        var result = await _paymentService.RefundAsync(dto, cancellationToken);
        if (result.Success) await BroadcastAsync("PaymentUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("{paymentId:guid}/refund")]
    [Authorize(Policy = Permissions.PaymentRefund)]
    [ProducesResponseType(typeof(ApiResponse<RefundResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ProcessRefundById(Guid paymentId, [FromBody] RefundByIdDto dto, CancellationToken cancellationToken)
    {
        var refundDto = new RefundDto
        {
            PaymentId = paymentId,
            Amount = dto.Amount,
            Reason = dto.Reason
        };
        var result = await _paymentService.RefundAsync(refundDto, cancellationToken);
        if (result.Success) await BroadcastAsync("PaymentUpdated");
        return StatusCode(result.StatusCode, result);
    }
}
