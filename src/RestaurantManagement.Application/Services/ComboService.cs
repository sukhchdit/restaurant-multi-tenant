using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Menu;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class ComboService : IComboService
{
    private readonly IRepository<MenuItemCombo> _comboRepository;
    private readonly IRepository<ComboItem> _comboItemRepository;
    private readonly IRepository<MenuItem> _menuItemRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public ComboService(
        IRepository<MenuItemCombo> comboRepository,
        IRepository<ComboItem> comboItemRepository,
        IRepository<MenuItem> menuItemRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser)
    {
        _comboRepository = comboRepository;
        _comboItemRepository = comboItemRepository;
        _menuItemRepository = menuItemRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<List<ComboDto>>> GetCombosAsync(CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<List<ComboDto>>.Fail("Restaurant context not found.", 403);

        var combos = await _comboRepository.QueryNoTracking()
            .Include(c => c.ComboItems)
                .ThenInclude(ci => ci.MenuItem)
            .Where(c => c.RestaurantId == restaurantId.Value && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = combos.Select(MapToDto).ToList();
        return ApiResponse<List<ComboDto>>.Ok(result);
    }

    public async Task<ApiResponse<ComboDto>> GetComboByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<ComboDto>.Fail("Restaurant context not found.", 403);

        var combo = await _comboRepository.QueryNoTracking()
            .Include(c => c.ComboItems)
                .ThenInclude(ci => ci.MenuItem)
            .FirstOrDefaultAsync(c => c.Id == id && c.RestaurantId == restaurantId.Value && !c.IsDeleted, cancellationToken);

        if (combo == null)
            return ApiResponse<ComboDto>.Fail("Combo not found.", 404);

        return ApiResponse<ComboDto>.Ok(MapToDto(combo));
    }

    public async Task<ApiResponse<ComboDto>> CreateAsync(CreateComboDto dto, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<ComboDto>.Fail("Restaurant context not found.", 403);

        if (dto.Items.Count == 0)
            return ApiResponse<ComboDto>.Fail("At least one product is required.");

        var combo = new MenuItemCombo
        {
            RestaurantId = restaurantId.Value,
            TenantId = _currentUser.TenantId ?? Guid.Empty,
            Name = dto.Name,
            Description = dto.Description,
            ComboPrice = dto.ComboPrice,
            IsAvailable = true,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            CreatedBy = _currentUser.UserId
        };

        await _comboRepository.AddAsync(combo, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        foreach (var item in dto.Items)
        {
            var comboItem = new ComboItem
            {
                ComboId = combo.Id,
                MenuItemId = item.MenuItemId,
                Quantity = item.Quantity
            };
            await _comboItemRepository.AddAsync(comboItem, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetComboByIdAsync(combo.Id, cancellationToken);
    }

    public async Task<ApiResponse<ComboDto>> UpdateAsync(Guid id, UpdateComboDto dto, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<ComboDto>.Fail("Restaurant context not found.", 403);

        var combo = await _comboRepository.Query()
            .Include(c => c.ComboItems)
            .FirstOrDefaultAsync(c => c.Id == id && c.RestaurantId == restaurantId.Value && !c.IsDeleted, cancellationToken);

        if (combo == null)
            return ApiResponse<ComboDto>.Fail("Combo not found.", 404);

        if (dto.Items.Count == 0)
            return ApiResponse<ComboDto>.Fail("At least one product is required.");

        combo.Name = dto.Name;
        combo.Description = dto.Description;
        combo.ComboPrice = dto.ComboPrice;
        combo.StartDate = dto.StartDate;
        combo.EndDate = dto.EndDate;
        combo.UpdatedAt = DateTime.UtcNow;
        combo.UpdatedBy = _currentUser.UserId;
        _comboRepository.Update(combo);

        // Remove existing items
        foreach (var existing in combo.ComboItems.ToList())
        {
            _comboItemRepository.Delete(existing);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Add new items
        foreach (var item in dto.Items)
        {
            var comboItem = new ComboItem
            {
                ComboId = combo.Id,
                MenuItemId = item.MenuItemId,
                Quantity = item.Quantity
            };
            await _comboItemRepository.AddAsync(comboItem, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetComboByIdAsync(combo.Id, cancellationToken);
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse.Fail("Restaurant context not found.", 403);

        var combo = await _comboRepository.Query()
            .FirstOrDefaultAsync(c => c.Id == id && c.RestaurantId == restaurantId.Value && !c.IsDeleted, cancellationToken);

        if (combo == null)
            return ApiResponse.Fail("Combo not found.", 404);

        combo.IsDeleted = true;
        combo.DeletedAt = DateTime.UtcNow;
        combo.DeletedBy = _currentUser.UserId;
        _comboRepository.Update(combo);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok("Combo deleted successfully.");
    }

    public async Task<ApiResponse<ComboDto>> ToggleAvailabilityAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<ComboDto>.Fail("Restaurant context not found.", 403);

        var combo = await _comboRepository.Query()
            .Include(c => c.ComboItems)
                .ThenInclude(ci => ci.MenuItem)
            .FirstOrDefaultAsync(c => c.Id == id && c.RestaurantId == restaurantId.Value && !c.IsDeleted, cancellationToken);

        if (combo == null)
            return ApiResponse<ComboDto>.Fail("Combo not found.", 404);

        combo.IsAvailable = !combo.IsAvailable;
        combo.UpdatedAt = DateTime.UtcNow;
        combo.UpdatedBy = _currentUser.UserId;
        _comboRepository.Update(combo);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<ComboDto>.Ok(MapToDto(combo), $"Combo {(combo.IsAvailable ? "activated" : "deactivated")}.");
    }

    private static ComboDto MapToDto(MenuItemCombo combo)
    {
        var items = combo.ComboItems
            .Where(ci => ci.MenuItem != null)
            .Select(ci => new ComboItemDto
            {
                Id = ci.Id,
                MenuItemId = ci.MenuItemId,
                MenuItemName = ci.MenuItem.Name,
                MenuItemPrice = ci.MenuItem.Price,
                Quantity = ci.Quantity
            }).ToList();

        var originalTotal = items.Sum(i => i.MenuItemPrice * i.Quantity);

        return new ComboDto
        {
            Id = combo.Id,
            Name = combo.Name,
            Description = combo.Description,
            ComboPrice = combo.ComboPrice,
            OriginalTotalPrice = originalTotal,
            ComboDiscount = originalTotal > 0 ? originalTotal - combo.ComboPrice : 0,
            ImageUrl = combo.ImageUrl,
            IsAvailable = combo.IsAvailable,
            StartDate = combo.StartDate,
            EndDate = combo.EndDate,
            CreatedAt = combo.CreatedAt,
            Items = items
        };
    }
}
