using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.Discount;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DiscountController : ControllerBase
{
    private readonly IDiscountService _discountService;

    public DiscountController(IDiscountService discountService)
    {
        _discountService = discountService;
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
        return StatusCode(result.StatusCode, result);
    }
}
