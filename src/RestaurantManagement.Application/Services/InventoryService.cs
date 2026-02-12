using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.DTOs.Inventory;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class InventoryService : IInventoryService
{
    private readonly IRepository<InventoryItem> _inventoryItemRepository;
    private readonly IRepository<StockMovement> _stockMovementRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public InventoryService(
        IRepository<InventoryItem> inventoryItemRepository,
        IRepository<StockMovement> stockMovementRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _inventoryItemRepository = inventoryItemRepository;
        _stockMovementRepository = stockMovementRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PaginatedResultDto<InventoryItemDto>>> GetItemsAsync(
        int pageNumber = 1, int pageSize = 20, string? search = null, Guid? categoryId = null,
        CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<PaginatedResultDto<InventoryItemDto>>.Fail("Restaurant context not found.", 403);

        var query = _inventoryItemRepository.QueryNoTracking()
            .Where(i => i.RestaurantId == restaurantId.Value && !i.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(i => i.Name.ToLower().Contains(searchLower)
                                     || (i.SKU != null && i.SKU.ToLower().Contains(searchLower)));
        }

        if (categoryId.HasValue)
            query = query.Where(i => i.CategoryId == categoryId.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Include(i => i.Category)
            .Include(i => i.Supplier)
            .OrderBy(i => i.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = _mapper.Map<List<InventoryItemDto>>(items);
        var result = new PaginatedResultDto<InventoryItemDto>(dtos, totalCount, pageNumber, pageSize);

        return ApiResponse<PaginatedResultDto<InventoryItemDto>>.Ok(result);
    }

    public async Task<ApiResponse<InventoryItemDto>> CreateItemAsync(CreateInventoryItemDto dto, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<InventoryItemDto>.Fail("Restaurant context not found.", 403);

        var item = new InventoryItem
        {
            RestaurantId = restaurantId.Value,
            TenantId = _currentUser.TenantId ?? Guid.Empty,
            CategoryId = dto.CategoryId,
            SupplierId = dto.SupplierId,
            Name = dto.Name,
            Unit = dto.Unit,
            CurrentStock = dto.CurrentStock,
            MinStock = dto.MinStock,
            MaxStock = dto.MaxStock,
            CostPerUnit = dto.CostPerUnit,
            ExpiryDate = dto.ExpiryDate,
            StorageLocation = dto.StorageLocation,
            LastRestockedAt = dto.CurrentStock > 0 ? DateTime.UtcNow : null,
            CreatedBy = _currentUser.UserId
        };

        await _inventoryItemRepository.AddAsync(item, cancellationToken);

        // Record initial stock movement if stock > 0
        if (dto.CurrentStock > 0)
        {
            var movement = new StockMovement
            {
                InventoryItemId = item.Id,
                TenantId = item.TenantId,
                MovementType = StockMovementType.Inward,
                Quantity = dto.CurrentStock,
                PreviousStock = 0,
                NewStock = dto.CurrentStock,
                CostPerUnit = dto.CostPerUnit,
                Notes = "Initial stock",
                CreatedBy = _currentUser.UserId
            };
            await _stockMovementRepository.AddAsync(movement, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<InventoryItemDto>(item);
        return ApiResponse<InventoryItemDto>.Ok(result, "Inventory item created successfully.");
    }

    public async Task<ApiResponse<InventoryItemDto>> UpdateItemAsync(Guid id, CreateInventoryItemDto dto, CancellationToken cancellationToken = default)
    {
        var item = await _inventoryItemRepository.Query()
            .Include(i => i.Category)
            .Include(i => i.Supplier)
            .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted, cancellationToken);

        if (item == null)
            return ApiResponse<InventoryItemDto>.Fail("Inventory item not found.", 404);

        item.CategoryId = dto.CategoryId;
        item.SupplierId = dto.SupplierId;
        item.Name = dto.Name;
        item.Unit = dto.Unit;
        item.MinStock = dto.MinStock;
        item.MaxStock = dto.MaxStock;
        item.CostPerUnit = dto.CostPerUnit;
        item.ExpiryDate = dto.ExpiryDate;
        item.StorageLocation = dto.StorageLocation;
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = _currentUser.UserId;

        _inventoryItemRepository.Update(item);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<InventoryItemDto>(item);
        return ApiResponse<InventoryItemDto>.Ok(result, "Inventory item updated successfully.");
    }

    public async Task<ApiResponse<InventoryItemDto>> RestockAsync(Guid id, RestockDto dto, CancellationToken cancellationToken = default)
    {
        var item = await _inventoryItemRepository.Query()
            .Include(i => i.Category)
            .Include(i => i.Supplier)
            .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted, cancellationToken);

        if (item == null)
            return ApiResponse<InventoryItemDto>.Fail("Inventory item not found.", 404);

        if (dto.Quantity <= 0)
            return ApiResponse<InventoryItemDto>.Fail("Restock quantity must be greater than zero.");

        var previousStock = item.CurrentStock;
        item.CurrentStock += dto.Quantity;
        item.LastRestockedAt = DateTime.UtcNow;
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = _currentUser.UserId;

        if (dto.CostPerUnit.HasValue)
            item.CostPerUnit = dto.CostPerUnit.Value;

        _inventoryItemRepository.Update(item);

        var movement = new StockMovement
        {
            InventoryItemId = item.Id,
            TenantId = item.TenantId,
            MovementType = StockMovementType.Inward,
            Quantity = dto.Quantity,
            PreviousStock = previousStock,
            NewStock = item.CurrentStock,
            CostPerUnit = dto.CostPerUnit ?? item.CostPerUnit,
            Notes = dto.Notes ?? "Restock",
            CreatedBy = _currentUser.UserId
        };
        await _stockMovementRepository.AddAsync(movement, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<InventoryItemDto>(item);
        return ApiResponse<InventoryItemDto>.Ok(result, "Item restocked successfully.");
    }

    public async Task<ApiResponse<List<StockMovementDto>>> GetMovementsAsync(Guid itemId, CancellationToken cancellationToken = default)
    {
        var movements = await _stockMovementRepository.QueryNoTracking()
            .Where(m => m.InventoryItemId == itemId && !m.IsDeleted)
            .Include(m => m.InventoryItem)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = _mapper.Map<List<StockMovementDto>>(movements);
        return ApiResponse<List<StockMovementDto>>.Ok(result);
    }

    public async Task<ApiResponse<List<InventoryItemDto>>> GetLowStockAsync(CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<List<InventoryItemDto>>.Fail("Restaurant context not found.", 403);

        var items = await _inventoryItemRepository.QueryNoTracking()
            .Where(i => i.RestaurantId == restaurantId.Value && !i.IsDeleted && i.CurrentStock <= i.MinStock)
            .Include(i => i.Category)
            .Include(i => i.Supplier)
            .OrderBy(i => i.CurrentStock)
            .ToListAsync(cancellationToken);

        var result = _mapper.Map<List<InventoryItemDto>>(items);
        return ApiResponse<List<InventoryItemDto>>.Ok(result);
    }
}
