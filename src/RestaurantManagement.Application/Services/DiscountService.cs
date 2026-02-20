using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Discount;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class DiscountService : IDiscountService
{
    private readonly IRepository<Discount> _discountRepository;
    private readonly IRepository<Coupon> _couponRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public DiscountService(
        IRepository<Discount> discountRepository,
        IRepository<Coupon> couponRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _discountRepository = discountRepository;
        _couponRepository = couponRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApiResponse<List<DiscountDto>>> GetDiscountsAsync(bool? activeOnly = null, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<List<DiscountDto>>.Fail("Restaurant context not found.", 403);

        var query = _discountRepository.QueryNoTracking()
            .Where(d => d.RestaurantId == restaurantId.Value && !d.IsDeleted);

        if (activeOnly == true)
        {
            var now = DateTime.UtcNow;
            query = query.Where(d => d.IsActive
                                     && (!d.StartDate.HasValue || d.StartDate.Value <= now)
                                     && (!d.EndDate.HasValue || d.EndDate.Value >= now));
        }

        var discounts = await query
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = _mapper.Map<List<DiscountDto>>(discounts);
        return ApiResponse<List<DiscountDto>>.Ok(result);
    }

    public async Task<ApiResponse<DiscountDto>> CreateAsync(CreateDiscountDto dto, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<DiscountDto>.Fail("Restaurant context not found.", 403);

        var discount = new Discount
        {
            RestaurantId = restaurantId.Value,
            TenantId = _currentUser.TenantId ?? Guid.Empty,
            Name = dto.Name,
            DiscountType = dto.DiscountType,
            Value = dto.Value,
            MinOrderAmount = dto.MinOrderAmount,
            MaxDiscountAmount = dto.MaxDiscountAmount,
            ApplicableOn = dto.ApplicableOn,
            CategoryId = dto.CategoryId,
            MenuItemId = dto.MenuItemId,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsActive = true,
            AutoApply = dto.AutoApply,
            CreatedBy = _currentUser.UserId
        };

        await _discountRepository.AddAsync(discount, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<DiscountDto>(discount);
        return ApiResponse<DiscountDto>.Ok(result, "Discount created successfully.");
    }

    public async Task<ApiResponse<DiscountDto>> UpdateAsync(Guid id, UpdateDiscountDto dto, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<DiscountDto>.Fail("Restaurant context not found.", 403);

        var discount = await _discountRepository.Query()
            .FirstOrDefaultAsync(d => d.Id == id && d.RestaurantId == restaurantId.Value && !d.IsDeleted, cancellationToken);

        if (discount == null)
            return ApiResponse<DiscountDto>.Fail("Discount not found.", 404);

        discount.Name = dto.Name;
        discount.DiscountType = dto.DiscountType;
        discount.Value = dto.Value;
        discount.MinOrderAmount = dto.MinOrderAmount;
        discount.MaxDiscountAmount = dto.MaxDiscountAmount;
        discount.ApplicableOn = dto.ApplicableOn;
        discount.CategoryId = dto.CategoryId;
        discount.MenuItemId = dto.MenuItemId;
        discount.StartDate = dto.StartDate;
        discount.EndDate = dto.EndDate;
        discount.AutoApply = dto.AutoApply;
        discount.UpdatedBy = _currentUser.UserId;

        _discountRepository.Update(discount);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<DiscountDto>(discount);
        return ApiResponse<DiscountDto>.Ok(result, "Discount updated successfully.");
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse.Fail("Restaurant context not found.", 403);

        var discount = await _discountRepository.Query()
            .FirstOrDefaultAsync(d => d.Id == id && d.RestaurantId == restaurantId.Value && !d.IsDeleted, cancellationToken);

        if (discount == null)
            return ApiResponse.Fail("Discount not found.", 404);

        discount.IsDeleted = true;
        discount.UpdatedBy = _currentUser.UserId;
        _discountRepository.Update(discount);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok("Discount deleted successfully.");
    }

    public async Task<ApiResponse<DiscountDto>> ToggleActiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<DiscountDto>.Fail("Restaurant context not found.", 403);

        var discount = await _discountRepository.Query()
            .FirstOrDefaultAsync(d => d.Id == id && d.RestaurantId == restaurantId.Value && !d.IsDeleted, cancellationToken);

        if (discount == null)
            return ApiResponse<DiscountDto>.Fail("Discount not found.", 404);

        discount.IsActive = !discount.IsActive;
        discount.UpdatedBy = _currentUser.UserId;
        _discountRepository.Update(discount);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<DiscountDto>(discount);
        return ApiResponse<DiscountDto>.Ok(result, $"Discount {(discount.IsActive ? "activated" : "deactivated")}.");
    }

    public async Task<ApiResponse<List<CouponDto>>> GetCouponsAsync(CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<List<CouponDto>>.Fail("Restaurant context not found.", 403);

        var coupons = await _couponRepository.QueryNoTracking()
            .Include(c => c.Discount)
            .Where(c => c.RestaurantId == restaurantId.Value && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = _mapper.Map<List<CouponDto>>(coupons);
        return ApiResponse<List<CouponDto>>.Ok(result);
    }

    public async Task<ApiResponse<CouponDto>> CreateCouponAsync(CreateCouponDto dto, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<CouponDto>.Fail("Restaurant context not found.", 403);

        // Verify the discount exists
        var discount = await _discountRepository.QueryNoTracking()
            .FirstOrDefaultAsync(d => d.Id == dto.DiscountId && d.RestaurantId == restaurantId.Value && !d.IsDeleted, cancellationToken);

        if (discount == null)
            return ApiResponse<CouponDto>.Fail("Discount not found.", 404);

        // Check for duplicate code
        var existing = await _couponRepository.QueryNoTracking()
            .AnyAsync(c => c.Code == dto.Code && c.RestaurantId == restaurantId.Value && !c.IsDeleted, cancellationToken);

        if (existing)
            return ApiResponse<CouponDto>.Fail("A coupon with this code already exists.");

        var coupon = new Coupon
        {
            RestaurantId = restaurantId.Value,
            TenantId = _currentUser.TenantId ?? Guid.Empty,
            Code = dto.Code.ToUpperInvariant(),
            DiscountId = dto.DiscountId,
            MaxUsageCount = dto.MaxUsageCount,
            MaxPerCustomer = dto.MaxPerCustomer,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsActive = true,
            CreatedBy = _currentUser.UserId
        };

        await _couponRepository.AddAsync(coupon, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<CouponDto>(coupon);
        result.DiscountName = discount.Name;
        return ApiResponse<CouponDto>.Ok(result, "Coupon created successfully.");
    }

    public async Task<ApiResponse> DeleteCouponAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse.Fail("Restaurant context not found.", 403);

        var coupon = await _couponRepository.Query()
            .FirstOrDefaultAsync(c => c.Id == id && c.RestaurantId == restaurantId.Value && !c.IsDeleted, cancellationToken);

        if (coupon == null)
            return ApiResponse.Fail("Coupon not found.", 404);

        coupon.IsDeleted = true;
        coupon.UpdatedBy = _currentUser.UserId;
        _couponRepository.Update(coupon);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok("Coupon deleted successfully.");
    }

    public async Task<ApiResponse<CouponDto>> ToggleCouponActiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<CouponDto>.Fail("Restaurant context not found.", 403);

        var coupon = await _couponRepository.Query()
            .Include(c => c.Discount)
            .FirstOrDefaultAsync(c => c.Id == id && c.RestaurantId == restaurantId.Value && !c.IsDeleted, cancellationToken);

        if (coupon == null)
            return ApiResponse<CouponDto>.Fail("Coupon not found.", 404);

        coupon.IsActive = !coupon.IsActive;
        coupon.UpdatedBy = _currentUser.UserId;
        _couponRepository.Update(coupon);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<CouponDto>(coupon);
        return ApiResponse<CouponDto>.Ok(result, $"Coupon {(coupon.IsActive ? "activated" : "deactivated")}.");
    }

    public async Task<ApiResponse<CouponDto>> ValidateCouponAsync(string couponCode, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<CouponDto>.Fail("Restaurant context not found.", 403);

        var coupon = await _couponRepository.Query()
            .Include(c => c.Discount)
            .FirstOrDefaultAsync(c => c.Code == couponCode
                                      && c.RestaurantId == restaurantId.Value
                                      && !c.IsDeleted,
                cancellationToken);

        if (coupon == null)
            return ApiResponse<CouponDto>.Fail("Coupon not found.");

        if (!coupon.IsActive)
            return ApiResponse<CouponDto>.Fail("Coupon is inactive.");

        var now = DateTime.UtcNow;
        if (coupon.StartDate.HasValue && coupon.StartDate.Value > now)
            return ApiResponse<CouponDto>.Fail("Coupon is not yet active.");

        if (coupon.EndDate.HasValue && coupon.EndDate.Value < now)
            return ApiResponse<CouponDto>.Fail("Coupon has expired.");

        if (coupon.UsedCount >= coupon.MaxUsageCount)
            return ApiResponse<CouponDto>.Fail("Coupon usage limit has been reached.");

        var result = _mapper.Map<CouponDto>(coupon);
        result.DiscountName = coupon.Discount?.Name;

        return ApiResponse<CouponDto>.Ok(result, "Coupon is valid.");
    }

    public async Task<ApiResponse<ApplyDiscountResultDto>> ApplyDiscountAsync(ApplyDiscountDto dto, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<ApplyDiscountResultDto>.Fail("Restaurant context not found.", 403);

        var coupon = await _couponRepository.Query()
            .Include(c => c.Discount)
            .FirstOrDefaultAsync(c => c.Code == dto.CouponCode
                                      && c.RestaurantId == restaurantId.Value
                                      && c.IsActive && !c.IsDeleted,
                cancellationToken);

        if (coupon == null)
            return ApiResponse<ApplyDiscountResultDto>.Fail("Invalid coupon code.");

        var now = DateTime.UtcNow;
        if (coupon.StartDate.HasValue && coupon.StartDate.Value > now)
            return ApiResponse<ApplyDiscountResultDto>.Fail("Coupon is not yet active.");

        if (coupon.EndDate.HasValue && coupon.EndDate.Value < now)
            return ApiResponse<ApplyDiscountResultDto>.Fail("Coupon has expired.");

        if (coupon.UsedCount >= coupon.MaxUsageCount)
            return ApiResponse<ApplyDiscountResultDto>.Fail("Coupon usage limit has been reached.");

        var discount = coupon.Discount;
        if (discount == null || !discount.IsActive)
            return ApiResponse<ApplyDiscountResultDto>.Fail("Associated discount is not active.");

        if (discount.MinOrderAmount.HasValue && dto.OrderTotal < discount.MinOrderAmount.Value)
            return ApiResponse<ApplyDiscountResultDto>.Fail($"Minimum order amount of {discount.MinOrderAmount.Value} not met.");

        decimal discountAmount;
        if (discount.DiscountType == DiscountType.Percentage)
        {
            discountAmount = Math.Round(dto.OrderTotal * discount.Value / 100, 2);
            if (discount.MaxDiscountAmount.HasValue && discountAmount > discount.MaxDiscountAmount.Value)
                discountAmount = discount.MaxDiscountAmount.Value;
        }
        else
        {
            discountAmount = discount.Value;
        }

        discountAmount = Math.Min(discountAmount, dto.OrderTotal);

        var result = new ApplyDiscountResultDto
        {
            DiscountId = discount.Id,
            DiscountName = discount.Name,
            DiscountAmount = discountAmount,
            NewTotal = dto.OrderTotal - discountAmount
        };

        return ApiResponse<ApplyDiscountResultDto>.Ok(result, "Discount applied successfully.");
    }
}
