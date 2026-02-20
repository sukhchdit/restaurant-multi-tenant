using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RestaurantManagement.API.Hubs;
using RestaurantManagement.Application.DTOs.Discount;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/discounts")]
[Authorize]
public class DiscountController : ControllerBase
{
    private readonly IDiscountService _discountService;
    private readonly IHubContext<OrderHub> _orderHub;

    public DiscountController(IDiscountService discountService, IHubContext<OrderHub> orderHub)
    {
        _discountService = discountService;
        _orderHub = orderHub;
    }

    private async Task BroadcastAsync(string eventName)
    {
        var tenantId = User.FindFirst("tenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantId))
            await _orderHub.Clients.Group($"tenant_{tenantId}").SendAsync(eventName);
    }

    [HttpGet]
    [Authorize(Policy = Permissions.DiscountView)]
    [ProducesResponseType(typeof(ApiResponse<List<DiscountDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDiscounts([FromQuery] bool? activeOnly = null, CancellationToken cancellationToken = default)
    {
        var result = await _discountService.GetDiscountsAsync(activeOnly, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.DiscountCreate)]
    [ProducesResponseType(typeof(ApiResponse<DiscountDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateDiscount([FromBody] CreateDiscountDto dto, CancellationToken cancellationToken)
    {
        var result = await _discountService.CreateAsync(dto, cancellationToken);
        if (result.Success) await BroadcastAsync("DiscountUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Permissions.DiscountUpdate)]
    [ProducesResponseType(typeof(ApiResponse<DiscountDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateDiscount(Guid id, [FromBody] UpdateDiscountDto dto, CancellationToken cancellationToken)
    {
        var result = await _discountService.UpdateAsync(id, dto, cancellationToken);
        if (result.Success) await BroadcastAsync("DiscountUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Permissions.DiscountDelete)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDiscount(Guid id, CancellationToken cancellationToken)
    {
        var result = await _discountService.DeleteAsync(id, cancellationToken);
        if (result.Success) await BroadcastAsync("DiscountUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpPatch("{id:guid}/toggle")]
    [Authorize(Policy = Permissions.DiscountUpdate)]
    [ProducesResponseType(typeof(ApiResponse<DiscountDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleActive(Guid id, CancellationToken cancellationToken)
    {
        var result = await _discountService.ToggleActiveAsync(id, cancellationToken);
        if (result.Success) await BroadcastAsync("DiscountUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("coupons")]
    [Authorize(Policy = Permissions.DiscountView)]
    [ProducesResponseType(typeof(ApiResponse<List<CouponDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCoupons(CancellationToken cancellationToken)
    {
        var result = await _discountService.GetCouponsAsync(cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("coupons")]
    [Authorize(Policy = Permissions.DiscountCreate)]
    [ProducesResponseType(typeof(ApiResponse<CouponDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCoupon([FromBody] CreateCouponDto dto, CancellationToken cancellationToken)
    {
        var result = await _discountService.CreateCouponAsync(dto, cancellationToken);
        if (result.Success) await BroadcastAsync("DiscountUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpDelete("coupons/{id:guid}")]
    [Authorize(Policy = Permissions.DiscountDelete)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCoupon(Guid id, CancellationToken cancellationToken)
    {
        var result = await _discountService.DeleteCouponAsync(id, cancellationToken);
        if (result.Success) await BroadcastAsync("DiscountUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpPatch("coupons/{id:guid}/toggle")]
    [Authorize(Policy = Permissions.DiscountUpdate)]
    [ProducesResponseType(typeof(ApiResponse<CouponDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleCouponActive(Guid id, CancellationToken cancellationToken)
    {
        var result = await _discountService.ToggleCouponActiveAsync(id, cancellationToken);
        if (result.Success) await BroadcastAsync("DiscountUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("coupons/{couponCode}/validate")]
    [Authorize(Policy = Permissions.DiscountView)]
    [ProducesResponseType(typeof(ApiResponse<CouponDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ValidateCoupon(string couponCode, CancellationToken cancellationToken)
    {
        var result = await _discountService.ValidateCouponAsync(couponCode, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("apply")]
    [Authorize(Policy = Permissions.DiscountView)]
    [ProducesResponseType(typeof(ApiResponse<ApplyDiscountResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApplyDiscount([FromBody] ApplyDiscountDto dto, CancellationToken cancellationToken)
    {
        var result = await _discountService.ApplyDiscountAsync(dto, cancellationToken);
        if (result.Success) await BroadcastAsync("DiscountUpdated");
        return StatusCode(result.StatusCode, result);
    }
}
