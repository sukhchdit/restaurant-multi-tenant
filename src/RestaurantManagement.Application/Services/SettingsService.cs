using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class SettingsService : ISettingsService
{
    private readonly IRepository<TenantSettings> _settingsRepository;
    private readonly IRepository<Restaurant> _restaurantRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public SettingsService(
        IRepository<TenantSettings> settingsRepository,
        IRepository<Restaurant> restaurantRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser)
    {
        _settingsRepository = settingsRepository;
        _restaurantRepository = restaurantRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<SettingsDto>> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        var tenantId = _currentUser.TenantId;
        if (tenantId == null)
            return ApiResponse<SettingsDto>.Fail("Tenant context not found.", 403);

        var restaurantId = _currentUser.RestaurantId;

        var settings = await _settingsRepository.Query()
            .FirstOrDefaultAsync(s => s.TenantId == tenantId.Value && !s.IsDeleted, cancellationToken);

        Restaurant? restaurant = null;
        if (restaurantId != null)
        {
            restaurant = await _restaurantRepository.Query()
                .FirstOrDefaultAsync(r => r.Id == restaurantId.Value && !r.IsDeleted, cancellationToken);
        }

        var dto = new SettingsDto
        {
            Id = settings?.Id ?? Guid.Empty,
            RestaurantName = restaurant?.Name ?? string.Empty,
            Phone = restaurant?.Phone,
            Email = restaurant?.Email,
            Address = restaurant?.Address,
            GstNumber = restaurant?.GstNumber,
            FssaiNumber = restaurant?.FssaiNumber,
            Currency = settings?.Currency ?? "INR",
            TaxRate = settings?.TaxRate ?? 0,
            TimeZone = settings?.TimeZone ?? "Asia/Kolkata",
            DateFormat = settings?.DateFormat ?? "dd/MM/yyyy",
            ReceiptHeader = settings?.ReceiptHeader,
            ReceiptFooter = settings?.ReceiptFooter,
        };

        return ApiResponse<SettingsDto>.Ok(dto);
    }

    public async Task<ApiResponse<SettingsDto>> UpdateSettingsAsync(UpdateSettingsDto dto, CancellationToken cancellationToken = default)
    {
        var tenantId = _currentUser.TenantId;
        if (tenantId == null)
            return ApiResponse<SettingsDto>.Fail("Tenant context not found.", 403);

        var restaurantId = _currentUser.RestaurantId;

        // Update restaurant info
        if (restaurantId != null)
        {
            var restaurant = await _restaurantRepository.Query()
                .FirstOrDefaultAsync(r => r.Id == restaurantId.Value && !r.IsDeleted, cancellationToken);

            if (restaurant != null)
            {
                if (dto.RestaurantName != null) restaurant.Name = dto.RestaurantName;
                if (dto.Phone != null) restaurant.Phone = dto.Phone;
                if (dto.Email != null) restaurant.Email = dto.Email;
                if (dto.Address != null) restaurant.Address = dto.Address;
                if (dto.GstNumber != null) restaurant.GstNumber = dto.GstNumber;
                if (dto.FssaiNumber != null) restaurant.FssaiNumber = dto.FssaiNumber;
                restaurant.UpdatedAt = DateTime.UtcNow;
                restaurant.UpdatedBy = _currentUser.UserId;
                _restaurantRepository.Update(restaurant);
            }
        }

        // Update tenant settings
        var settings = await _settingsRepository.Query()
            .FirstOrDefaultAsync(s => s.TenantId == tenantId.Value && !s.IsDeleted, cancellationToken);

        if (settings == null)
        {
            settings = new TenantSettings
            {
                TenantId = tenantId.Value,
                Currency = dto.Currency ?? "INR",
                TaxRate = dto.TaxRate ?? 0,
                TimeZone = dto.TimeZone ?? "Asia/Kolkata",
                DateFormat = dto.DateFormat ?? "dd/MM/yyyy",
                ReceiptHeader = dto.ReceiptHeader,
                ReceiptFooter = dto.ReceiptFooter,
                CreatedBy = _currentUser.UserId
            };
            await _settingsRepository.AddAsync(settings, cancellationToken);
        }
        else
        {
            if (dto.Currency != null) settings.Currency = dto.Currency;
            if (dto.TaxRate.HasValue) settings.TaxRate = dto.TaxRate.Value;
            if (dto.TimeZone != null) settings.TimeZone = dto.TimeZone;
            if (dto.DateFormat != null) settings.DateFormat = dto.DateFormat;
            if (dto.ReceiptHeader != null) settings.ReceiptHeader = dto.ReceiptHeader;
            if (dto.ReceiptFooter != null) settings.ReceiptFooter = dto.ReceiptFooter;
            settings.UpdatedAt = DateTime.UtcNow;
            settings.UpdatedBy = _currentUser.UserId;
            _settingsRepository.Update(settings);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetSettingsAsync(cancellationToken);
    }
}
