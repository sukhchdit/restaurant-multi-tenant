using RestaurantManagement.Application.DTOs.Discount;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface IDiscountService
{
    Task<ApiResponse<List<DiscountDto>>> GetDiscountsAsync(bool? activeOnly = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<DiscountDto>> CreateAsync(CreateDiscountDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<DiscountDto>> UpdateAsync(Guid id, UpdateDiscountDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<DiscountDto>> ToggleActiveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<CouponDto>>> GetCouponsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<CouponDto>> CreateCouponAsync(CreateCouponDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteCouponAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<CouponDto>> ToggleCouponActiveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<CouponDto>> ValidateCouponAsync(string couponCode, CancellationToken cancellationToken = default);
    Task<ApiResponse<ApplyDiscountResultDto>> ApplyDiscountAsync(ApplyDiscountDto dto, CancellationToken cancellationToken = default);
}
