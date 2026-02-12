using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.DTOs.Menu;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class MenuService : IMenuService
{
    private readonly IRepository<MenuItem> _menuItemRepository;
    private readonly IRepository<Category> _categoryRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public MenuService(
        IRepository<MenuItem> menuItemRepository,
        IRepository<Category> categoryRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _menuItemRepository = menuItemRepository;
        _categoryRepository = categoryRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApiResponse<List<CategoryDto>>> GetCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<List<CategoryDto>>.Fail("Restaurant context not found.", 403);

        var categories = await _categoryRepository.Query()
            .Where(c => c.RestaurantId == restaurantId.Value && !c.IsDeleted && c.ParentCategoryId == null)
            .Include(c => c.SubCategories.Where(sc => !sc.IsDeleted))
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);

        var result = _mapper.Map<List<CategoryDto>>(categories);
        return ApiResponse<List<CategoryDto>>.Ok(result);
    }

    public async Task<ApiResponse<CategoryDto>> CreateCategoryAsync(CategoryDto dto, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<CategoryDto>.Fail("Restaurant context not found.", 403);

        var category = new Category
        {
            RestaurantId = restaurantId.Value,
            TenantId = _currentUser.TenantId ?? Guid.Empty,
            Name = dto.Name,
            Description = dto.Description,
            SortOrder = dto.SortOrder,
            ImageUrl = dto.ImageUrl,
            IsActive = dto.IsActive,
            ParentCategoryId = dto.ParentCategoryId,
            CreatedBy = _currentUser.UserId
        };

        await _categoryRepository.AddAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<CategoryDto>(category);
        return ApiResponse<CategoryDto>.Ok(result, "Category created successfully.");
    }

    public async Task<ApiResponse<PaginatedResultDto<MenuItemDto>>> GetItemsAsync(
        int pageNumber = 1, int pageSize = 20, string? search = null,
        Guid? categoryId = null, bool? isVeg = null, bool? isAvailable = null,
        CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<PaginatedResultDto<MenuItemDto>>.Fail("Restaurant context not found.", 403);

        var query = _menuItemRepository.QueryNoTracking()
            .Where(m => m.RestaurantId == restaurantId.Value && !m.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(m => m.Name.ToLower().Contains(searchLower)
                                     || (m.Description != null && m.Description.ToLower().Contains(searchLower))
                                     || (m.Tags != null && m.Tags.ToLower().Contains(searchLower)));
        }

        if (categoryId.HasValue)
            query = query.Where(m => m.CategoryId == categoryId.Value);

        if (isVeg.HasValue)
            query = query.Where(m => m.IsVeg == isVeg.Value);

        if (isAvailable.HasValue)
            query = query.Where(m => m.IsAvailable == isAvailable.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Include(m => m.Category)
            .OrderBy(m => m.SortOrder)
            .ThenBy(m => m.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = _mapper.Map<List<MenuItemDto>>(items);
        var result = new PaginatedResultDto<MenuItemDto>(dtos, totalCount, pageNumber, pageSize);

        return ApiResponse<PaginatedResultDto<MenuItemDto>>.Ok(result);
    }

    public async Task<ApiResponse<MenuItemDto>> GetItemByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await _menuItemRepository.Query()
            .Include(m => m.Category)
            .FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted, cancellationToken);

        if (item == null)
            return ApiResponse<MenuItemDto>.Fail("Menu item not found.", 404);

        var dto = _mapper.Map<MenuItemDto>(item);
        return ApiResponse<MenuItemDto>.Ok(dto);
    }

    public async Task<ApiResponse<MenuItemDto>> CreateItemAsync(CreateMenuItemDto dto, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<MenuItemDto>.Fail("Restaurant context not found.", 403);

        var categoryExists = await _categoryRepository.AnyAsync(
            c => c.Id == dto.CategoryId && c.RestaurantId == restaurantId.Value && !c.IsDeleted, cancellationToken);
        if (!categoryExists)
            return ApiResponse<MenuItemDto>.Fail("Category not found.");

        var item = new MenuItem
        {
            RestaurantId = restaurantId.Value,
            TenantId = _currentUser.TenantId ?? Guid.Empty,
            CategoryId = dto.CategoryId,
            Name = dto.Name,
            Description = dto.Description,
            Cuisine = dto.Cuisine,
            Price = dto.Price,
            IsVeg = dto.IsVeg,
            PreparationTime = dto.PreparationTime,
            Tags = dto.Tags,
            IsAvailable = true,
            CreatedBy = _currentUser.UserId
        };

        await _menuItemRepository.AddAsync(item, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var category = await _categoryRepository.GetByIdAsync(dto.CategoryId, cancellationToken);
        item.Category = category!;
        var result = _mapper.Map<MenuItemDto>(item);

        return ApiResponse<MenuItemDto>.Ok(result, "Menu item created successfully.");
    }

    public async Task<ApiResponse<MenuItemDto>> UpdateItemAsync(Guid id, UpdateMenuItemDto dto, CancellationToken cancellationToken = default)
    {
        var item = await _menuItemRepository.Query()
            .Include(m => m.Category)
            .FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted, cancellationToken);

        if (item == null)
            return ApiResponse<MenuItemDto>.Fail("Menu item not found.", 404);

        if (dto.CategoryId.HasValue)
        {
            var categoryExists = await _categoryRepository.AnyAsync(
                c => c.Id == dto.CategoryId.Value && !c.IsDeleted, cancellationToken);
            if (!categoryExists)
                return ApiResponse<MenuItemDto>.Fail("Category not found.");
            item.CategoryId = dto.CategoryId.Value;
        }

        if (dto.Name != null) item.Name = dto.Name;
        if (dto.Description != null) item.Description = dto.Description;
        if (dto.Cuisine != null) item.Cuisine = dto.Cuisine;
        if (dto.Price.HasValue) item.Price = dto.Price.Value;
        if (dto.DiscountedPrice.HasValue) item.DiscountedPrice = dto.DiscountedPrice.Value;
        if (dto.IsVeg.HasValue) item.IsVeg = dto.IsVeg.Value;
        if (dto.PreparationTime.HasValue) item.PreparationTime = dto.PreparationTime.Value;
        if (dto.ImageUrl != null) item.ImageUrl = dto.ImageUrl;
        if (dto.CalorieCount.HasValue) item.CalorieCount = dto.CalorieCount.Value;
        if (dto.SpiceLevel.HasValue) item.SpiceLevel = dto.SpiceLevel.Value;
        if (dto.Tags != null) item.Tags = dto.Tags;
        if (dto.SortOrder.HasValue) item.SortOrder = dto.SortOrder.Value;
        if (dto.AvailableFrom.HasValue) item.AvailableFrom = dto.AvailableFrom.Value;
        if (dto.AvailableTo.HasValue) item.AvailableTo = dto.AvailableTo.Value;
        if (dto.AvailableDays != null) item.AvailableDays = dto.AvailableDays;

        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = _currentUser.UserId;
        _menuItemRepository.Update(item);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<MenuItemDto>(item);
        return ApiResponse<MenuItemDto>.Ok(result, "Menu item updated successfully.");
    }

    public async Task<ApiResponse> DeleteItemAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await _menuItemRepository.GetByIdAsync(id, cancellationToken);
        if (item == null || item.IsDeleted)
            return ApiResponse.Fail("Menu item not found.", 404);

        item.IsDeleted = true;
        item.DeletedAt = DateTime.UtcNow;
        item.DeletedBy = _currentUser.UserId;
        _menuItemRepository.Update(item);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok("Menu item deleted successfully.");
    }

    public async Task<ApiResponse<MenuItemDto>> ToggleAvailabilityAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await _menuItemRepository.Query()
            .Include(m => m.Category)
            .FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted, cancellationToken);

        if (item == null)
            return ApiResponse<MenuItemDto>.Fail("Menu item not found.", 404);

        item.IsAvailable = !item.IsAvailable;
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = _currentUser.UserId;
        _menuItemRepository.Update(item);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<MenuItemDto>(item);
        return ApiResponse<MenuItemDto>.Ok(result, $"Menu item is now {(item.IsAvailable ? "available" : "unavailable")}.");
    }

    public async Task<ApiResponse<List<CategoryDto>>> GetPublicMenuAsync(Guid restaurantId, CancellationToken cancellationToken = default)
    {
        var categories = await _categoryRepository.Query()
            .Where(c => c.RestaurantId == restaurantId && !c.IsDeleted && c.IsActive && c.ParentCategoryId == null)
            .Include(c => c.SubCategories.Where(sc => !sc.IsDeleted && sc.IsActive))
            .Include(c => c.MenuItems.Where(m => !m.IsDeleted && m.IsAvailable))
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);

        var result = _mapper.Map<List<CategoryDto>>(categories);
        return ApiResponse<List<CategoryDto>>.Ok(result);
    }
}
