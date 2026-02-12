using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.DTOs.Order;
using RestaurantManagement.Application.DTOs.Report;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class OrderService : IOrderService
{
    private readonly IRepository<Order> _orderRepository;
    private readonly IRepository<OrderItem> _orderItemRepository;
    private readonly IRepository<MenuItem> _menuItemRepository;
    private readonly IRepository<RestaurantTable> _tableRepository;
    private readonly IRepository<KitchenOrderTicket> _kotRepository;
    private readonly IRepository<KOTItem> _kotItemRepository;
    private readonly IRepository<DishIngredient> _dishIngredientRepository;
    private readonly IRepository<InventoryItem> _inventoryItemRepository;
    private readonly IRepository<StockMovement> _stockMovementRepository;
    private readonly IRepository<TaxConfiguration> _taxConfigRepository;
    private readonly IRepository<Discount> _discountRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public OrderService(
        IRepository<Order> orderRepository,
        IRepository<OrderItem> orderItemRepository,
        IRepository<MenuItem> menuItemRepository,
        IRepository<RestaurantTable> tableRepository,
        IRepository<KitchenOrderTicket> kotRepository,
        IRepository<KOTItem> kotItemRepository,
        IRepository<DishIngredient> dishIngredientRepository,
        IRepository<InventoryItem> inventoryItemRepository,
        IRepository<StockMovement> stockMovementRepository,
        IRepository<TaxConfiguration> taxConfigRepository,
        IRepository<Discount> discountRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _orderRepository = orderRepository;
        _orderItemRepository = orderItemRepository;
        _menuItemRepository = menuItemRepository;
        _tableRepository = tableRepository;
        _kotRepository = kotRepository;
        _kotItemRepository = kotItemRepository;
        _dishIngredientRepository = dishIngredientRepository;
        _inventoryItemRepository = inventoryItemRepository;
        _stockMovementRepository = stockMovementRepository;
        _taxConfigRepository = taxConfigRepository;
        _discountRepository = discountRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PaginatedResultDto<OrderDto>>> GetOrdersAsync(
        int pageNumber = 1, int pageSize = 20, OrderStatus? status = null,
        OrderType? orderType = null, string? search = null,
        DateTime? fromDate = null, DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<PaginatedResultDto<OrderDto>>.Fail("Restaurant context not found.", 403);

        var query = _orderRepository.QueryNoTracking()
            .Where(o => o.RestaurantId == restaurantId.Value && !o.IsDeleted);

        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);

        if (orderType.HasValue)
            query = query.Where(o => o.OrderType == orderType.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(o => o.OrderNumber.ToLower().Contains(searchLower)
                                     || (o.CustomerName != null && o.CustomerName.ToLower().Contains(searchLower)));
        }

        if (fromDate.HasValue)
            query = query.Where(o => o.CreatedAt >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(o => o.CreatedAt <= toDate.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var orders = await query
            .Include(o => o.OrderItems)
            .Include(o => o.Table)
            .Include(o => o.Waiter)
            .OrderByDescending(o => o.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = _mapper.Map<List<OrderDto>>(orders);
        var result = new PaginatedResultDto<OrderDto>(dtos, totalCount, pageNumber, pageSize);

        return ApiResponse<PaginatedResultDto<OrderDto>>.Ok(result);
    }

    public async Task<ApiResponse<OrderDto>> GetOrderByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.Query()
            .Include(o => o.OrderItems)
            .Include(o => o.Table)
            .Include(o => o.Waiter)
            .FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted, cancellationToken);

        if (order == null)
            return ApiResponse<OrderDto>.Fail("Order not found.", 404);

        var dto = _mapper.Map<OrderDto>(order);
        return ApiResponse<OrderDto>.Ok(dto);
    }

    public async Task<ApiResponse<OrderDto>> CreateOrderAsync(CreateOrderDto dto, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<OrderDto>.Fail("Restaurant context not found.", 403);

        if (dto.Items == null || dto.Items.Count == 0)
            return ApiResponse<OrderDto>.Fail("Order must have at least one item.");

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var menuItemIds = dto.Items.Select(i => i.MenuItemId).Distinct().ToArray();
            var menuItems = await _menuItemRepository.Query()
                .Where(m => menuItemIds.Contains(m.Id) && !m.IsDeleted && m.IsAvailable)
                .ToListAsync(cancellationToken);

            if (menuItems.Count != menuItemIds.Length)
                return ApiResponse<OrderDto>.Fail("One or more menu items are not available.");

            var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

            var order = new Order
            {
                RestaurantId = restaurantId.Value,
                TenantId = _currentUser.TenantId ?? Guid.Empty,
                OrderNumber = orderNumber,
                TableId = dto.TableId,
                CustomerId = dto.CustomerId,
                CustomerName = dto.CustomerName,
                CustomerPhone = dto.CustomerPhone,
                OrderType = dto.OrderType,
                Status = OrderStatus.Pending,
                SpecialNotes = dto.SpecialNotes,
                DeliveryAddress = dto.DeliveryAddress,
                DiscountId = dto.DiscountId,
                CreatedBy = _currentUser.UserId
            };

            decimal subTotal = 0;
            var orderItems = new List<OrderItem>();

            foreach (var itemDto in dto.Items)
            {
                var menuItem = menuItems.First(m => m.Id == itemDto.MenuItemId);
                var unitPrice = menuItem.DiscountedPrice ?? menuItem.Price;
                var totalPrice = unitPrice * itemDto.Quantity;

                var orderItem = new OrderItem
                {
                    OrderId = order.Id,
                    TenantId = order.TenantId,
                    MenuItemId = menuItem.Id,
                    MenuItemName = menuItem.Name,
                    Quantity = itemDto.Quantity,
                    UnitPrice = unitPrice,
                    TotalPrice = totalPrice,
                    Notes = itemDto.Notes,
                    IsVeg = menuItem.IsVeg,
                    Status = OrderStatus.Pending,
                    CreatedBy = _currentUser.UserId
                };

                orderItems.Add(orderItem);
                subTotal += totalPrice;
            }

            order.SubTotal = subTotal;

            // Apply discount
            if (dto.DiscountId.HasValue)
            {
                var discount = await _discountRepository.GetByIdAsync(dto.DiscountId.Value, cancellationToken);
                if (discount != null && discount.IsActive)
                {
                    if (discount.DiscountType == DiscountType.Percentage)
                    {
                        order.DiscountAmount = Math.Round(subTotal * discount.Value / 100, 2);
                        if (discount.MaxDiscountAmount.HasValue && order.DiscountAmount > discount.MaxDiscountAmount.Value)
                            order.DiscountAmount = discount.MaxDiscountAmount.Value;
                    }
                    else
                    {
                        order.DiscountAmount = discount.Value;
                    }
                }
            }

            // Calculate tax
            var taxConfigs = await _taxConfigRepository.FindAsync(
                t => t.RestaurantId == restaurantId.Value && t.IsActive && !t.IsDeleted, cancellationToken);

            decimal taxableAmount = subTotal - order.DiscountAmount;
            decimal totalTax = 0;
            foreach (var tax in taxConfigs)
            {
                totalTax += Math.Round(taxableAmount * tax.Rate / 100, 2);
            }
            order.TaxAmount = totalTax;
            order.TotalAmount = taxableAmount + totalTax + order.DeliveryCharge;
            order.PaymentStatus = PaymentStatus.Pending;

            await _orderRepository.AddAsync(order, cancellationToken);
            await _orderItemRepository.AddRangeAsync(orderItems, cancellationToken);

            // Auto-create KOT
            var kotNumber = $"KOT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
            string? tableNumber = null;

            if (dto.TableId.HasValue)
            {
                var table = await _tableRepository.GetByIdAsync(dto.TableId.Value, cancellationToken);
                if (table != null)
                {
                    tableNumber = table.TableNumber;
                    table.Status = TableStatus.Reserved;
                    table.CurrentOrderId = order.Id;
                    _tableRepository.Update(table);
                }
            }

            var kot = new KitchenOrderTicket
            {
                RestaurantId = restaurantId.Value,
                TenantId = order.TenantId,
                OrderId = order.Id,
                KOTNumber = kotNumber,
                TableNumber = tableNumber,
                Status = KOTStatus.Sent,
                Priority = 0,
                SentAt = DateTime.UtcNow,
                CreatedBy = _currentUser.UserId
            };

            await _kotRepository.AddAsync(kot, cancellationToken);

            var kotItems = orderItems.Select(oi => new KOTItem
            {
                KOTId = kot.Id,
                OrderItemId = oi.Id,
                MenuItemName = oi.MenuItemName,
                Quantity = oi.Quantity,
                Notes = oi.Notes,
                IsVeg = oi.IsVeg,
                Status = KOTStatus.Sent
            }).ToList();

            await _kotItemRepository.AddRangeAsync(kotItems, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitAsync(cancellationToken);

            // Reload with includes for proper mapping
            var createdOrder = await _orderRepository.Query()
                .Include(o => o.OrderItems)
                .Include(o => o.Table)
                .Include(o => o.Waiter)
                .FirstOrDefaultAsync(o => o.Id == order.Id, cancellationToken);

            var result = _mapper.Map<OrderDto>(createdOrder);
            return ApiResponse<OrderDto>.Ok(result, "Order created successfully.");
        }
        catch
        {
            await _unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<ApiResponse<OrderDto>> UpdateOrderAsync(Guid id, UpdateOrderDto dto, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<OrderDto>.Fail("Restaurant context not found.", 403);

        var order = await _orderRepository.Query()
            .Include(o => o.OrderItems)
            .Include(o => o.Table)
            .Include(o => o.Waiter)
            .FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted, cancellationToken);

        if (order == null)
            return ApiResponse<OrderDto>.Fail("Order not found.", 404);

        // Allow editing any running order (not Completed or Cancelled)
        if (order.Status == OrderStatus.Completed || order.Status == OrderStatus.Cancelled)
            return ApiResponse<OrderDto>.Fail($"Cannot edit an order with status {order.Status}.");

        if (dto.CustomerName != null)
            order.CustomerName = dto.CustomerName;

        if (dto.CustomerPhone != null)
            order.CustomerPhone = dto.CustomerPhone;

        if (dto.SpecialNotes != null)
            order.SpecialNotes = dto.SpecialNotes;

        if (dto.DeliveryAddress != null)
            order.DeliveryAddress = dto.DeliveryAddress;

        if (dto.OrderType.HasValue)
            order.OrderType = dto.OrderType.Value;

        // Handle table change
        if (dto.TableId.HasValue && dto.TableId != order.TableId)
        {
            // Free old table
            if (order.TableId.HasValue)
            {
                var oldTable = await _tableRepository.GetByIdAsync(order.TableId.Value, cancellationToken);
                if (oldTable != null && oldTable.CurrentOrderId == order.Id)
                {
                    oldTable.Status = TableStatus.Available;
                    oldTable.CurrentOrderId = null;
                    _tableRepository.Update(oldTable);
                }
            }

            // Assign new table
            var newTable = await _tableRepository.GetByIdAsync(dto.TableId.Value, cancellationToken);
            if (newTable == null)
                return ApiResponse<OrderDto>.Fail("Table not found.", 404);

            if (newTable.Status != TableStatus.Available && newTable.CurrentOrderId != order.Id)
                return ApiResponse<OrderDto>.Fail("Selected table is not available.");

            newTable.Status = TableStatus.Reserved;
            newTable.CurrentOrderId = order.Id;
            _tableRepository.Update(newTable);
            order.TableId = dto.TableId.Value;
        }

        // Handle item changes
        if (dto.Items != null)
        {
            if (dto.Items.Count == 0)
                return ApiResponse<OrderDto>.Fail("Order must have at least one item.");

            var menuItemIds = dto.Items.Select(i => i.MenuItemId).Distinct().ToArray();
            var menuItems = await _menuItemRepository.Query()
                .Where(m => menuItemIds.Contains(m.Id) && !m.IsDeleted && m.IsAvailable)
                .ToListAsync(cancellationToken);

            if (menuItems.Count != menuItemIds.Length)
                return ApiResponse<OrderDto>.Fail("One or more menu items are not available.");

            var existingItems = order.OrderItems.Where(oi => !oi.IsDeleted).ToList();

            // Build lookup of desired items by MenuItemId
            var desiredByMenu = dto.Items.ToDictionary(i => i.MenuItemId);

            // Remove items no longer in the list
            foreach (var existing in existingItems)
            {
                if (!desiredByMenu.ContainsKey(existing.MenuItemId))
                {
                    existing.IsDeleted = true;
                    existing.DeletedAt = DateTime.UtcNow;
                    _orderItemRepository.Update(existing);
                }
            }

            // Update existing or add new items
            var newOrderItems = new List<OrderItem>();
            foreach (var itemDto in dto.Items)
            {
                var menuItem = menuItems.First(m => m.Id == itemDto.MenuItemId);
                var unitPrice = menuItem.DiscountedPrice ?? menuItem.Price;
                var totalPrice = unitPrice * itemDto.Quantity;

                var existingItem = existingItems.FirstOrDefault(oi => oi.MenuItemId == itemDto.MenuItemId);
                if (existingItem != null)
                {
                    // Update quantity and recalculate
                    existingItem.Quantity = itemDto.Quantity;
                    existingItem.UnitPrice = unitPrice;
                    existingItem.TotalPrice = totalPrice;
                    existingItem.Notes = itemDto.Notes;
                    existingItem.UpdatedAt = DateTime.UtcNow;
                    _orderItemRepository.Update(existingItem);
                }
                else
                {
                    // Add new item
                    var newItem = new OrderItem
                    {
                        OrderId = order.Id,
                        TenantId = order.TenantId,
                        MenuItemId = menuItem.Id,
                        MenuItemName = menuItem.Name,
                        Quantity = itemDto.Quantity,
                        UnitPrice = unitPrice,
                        TotalPrice = totalPrice,
                        Notes = itemDto.Notes,
                        IsVeg = menuItem.IsVeg,
                        Status = order.Status,
                        CreatedBy = _currentUser.UserId
                    };
                    newOrderItems.Add(newItem);
                }
            }

            if (newOrderItems.Count > 0)
                await _orderItemRepository.AddRangeAsync(newOrderItems, cancellationToken);

            // Recalculate totals
            // Gather all active items: updated existing + newly added
            decimal newSubTotal = 0;
            foreach (var itemDto in dto.Items)
            {
                var menuItem = menuItems.First(m => m.Id == itemDto.MenuItemId);
                var unitPrice = menuItem.DiscountedPrice ?? menuItem.Price;
                newSubTotal += unitPrice * itemDto.Quantity;
            }

            order.SubTotal = newSubTotal;

            // Re-apply discount
            if (order.DiscountId.HasValue)
            {
                var discount = await _discountRepository.GetByIdAsync(order.DiscountId.Value, cancellationToken);
                if (discount != null && discount.IsActive)
                {
                    if (discount.DiscountType == DiscountType.Percentage)
                    {
                        order.DiscountAmount = Math.Round(newSubTotal * discount.Value / 100, 2);
                        if (discount.MaxDiscountAmount.HasValue && order.DiscountAmount > discount.MaxDiscountAmount.Value)
                            order.DiscountAmount = discount.MaxDiscountAmount.Value;
                    }
                    else
                    {
                        order.DiscountAmount = discount.Value;
                    }
                }
            }
            else
            {
                order.DiscountAmount = 0;
            }

            // Recalculate tax
            var taxConfigs = await _taxConfigRepository.FindAsync(
                t => t.RestaurantId == restaurantId.Value && t.IsActive && !t.IsDeleted, cancellationToken);

            decimal taxableAmount = newSubTotal - order.DiscountAmount;
            decimal totalTax = 0;
            foreach (var tax in taxConfigs)
            {
                totalTax += Math.Round(taxableAmount * tax.Rate / 100, 2);
            }
            order.TaxAmount = totalTax;
            order.TotalAmount = taxableAmount + totalTax + order.DeliveryCharge;
        }

        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = _currentUser.UserId;

        _orderRepository.Update(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Reload for correct mapping
        var updated = await _orderRepository.Query()
            .Include(o => o.OrderItems)
            .Include(o => o.Table)
            .Include(o => o.Waiter)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

        var result = _mapper.Map<OrderDto>(updated);
        return ApiResponse<OrderDto>.Ok(result, "Order updated successfully.");
    }

    public async Task<ApiResponse<OrderDto>> UpdateOrderStatusAsync(Guid id, UpdateOrderStatusDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.Query()
            .Include(o => o.OrderItems)
            .Include(o => o.Table)
            .Include(o => o.Waiter)
            .FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted, cancellationToken);

        if (order == null)
            return ApiResponse<OrderDto>.Fail("Order not found.", 404);

        // Validate state transitions
        var validTransitions = new Dictionary<OrderStatus, OrderStatus[]>
        {
            { OrderStatus.Pending, new[] { OrderStatus.Confirmed, OrderStatus.Cancelled } },
            { OrderStatus.Confirmed, new[] { OrderStatus.Preparing, OrderStatus.Cancelled } },
            { OrderStatus.Preparing, new[] { OrderStatus.Ready, OrderStatus.Cancelled } },
            { OrderStatus.Ready, new[] { OrderStatus.Served } },
            { OrderStatus.Served, new[] { OrderStatus.Completed } }
        };

        if (!validTransitions.TryGetValue(order.Status, out var allowedStatuses) || !allowedStatuses.Contains(dto.Status))
            return ApiResponse<OrderDto>.Fail($"Cannot transition from {order.Status} to {dto.Status}.");

        order.Status = dto.Status;
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = _currentUser.UserId;

        // Auto stock deduction on Confirmed + mark table as Occupied
        if (dto.Status == OrderStatus.Confirmed)
        {
            await DeductStockForOrderAsync(order, cancellationToken);

            if (order.TableId.HasValue)
            {
                var table = await _tableRepository.GetByIdAsync(order.TableId.Value, cancellationToken);
                if (table != null)
                {
                    table.Status = TableStatus.Occupied;
                    table.UpdatedAt = DateTime.UtcNow;
                    _tableRepository.Update(table);
                }
            }
        }

        // Free table on Completed
        if (dto.Status == OrderStatus.Completed && order.TableId.HasValue)
        {
            var table = await _tableRepository.GetByIdAsync(order.TableId.Value, cancellationToken);
            if (table != null)
            {
                table.Status = TableStatus.Available;
                table.CurrentOrderId = null;
                _tableRepository.Update(table);
            }
        }

        _orderRepository.Update(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<OrderDto>(order);
        return ApiResponse<OrderDto>.Ok(result, "Order status updated successfully.");
    }

    public async Task<ApiResponse> CancelOrderAsync(Guid id, string? reason = null, CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.Query()
            .Include(o => o.Table)
            .FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted, cancellationToken);

        if (order == null)
            return ApiResponse.Fail("Order not found.", 404);

        if (order.Status == OrderStatus.Completed || order.Status == OrderStatus.Cancelled)
            return ApiResponse.Fail($"Cannot cancel an order with status {order.Status}.");

        order.Status = OrderStatus.Cancelled;
        order.CancelledAt = DateTime.UtcNow;
        order.CancelledBy = _currentUser.UserId;
        order.CancellationReason = reason;
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = _currentUser.UserId;

        if (order.TableId.HasValue)
        {
            var table = await _tableRepository.GetByIdAsync(order.TableId.Value, cancellationToken);
            if (table != null && table.CurrentOrderId == order.Id)
            {
                table.Status = TableStatus.Available;
                table.CurrentOrderId = null;
                _tableRepository.Update(table);
            }
        }

        _orderRepository.Update(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok("Order cancelled successfully.");
    }

    public async Task<ApiResponse> DeleteOrderAsync(Guid id, string? reason = null, CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.GetByIdAsync(id, cancellationToken);
        if (order == null || order.IsDeleted)
            return ApiResponse.Fail("Order not found.", 404);

        order.IsDeleted = true;
        order.DeletedAt = DateTime.UtcNow;
        order.DeletedBy = _currentUser.UserId;
        order.DeletionReason = reason;
        _orderRepository.Update(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok("Order deleted successfully.");
    }

    public async Task<ApiResponse<DashboardStatsDto>> GetDashboardStatsAsync(CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<DashboardStatsDto>.Fail("Restaurant context not found.", 403);

        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var todayOrders = await _orderRepository.QueryNoTracking()
            .Where(o => o.RestaurantId == restaurantId.Value && !o.IsDeleted
                        && o.CreatedAt >= today && o.CreatedAt < tomorrow)
            .ToListAsync(cancellationToken);

        var todayRevenue = todayOrders
            .Where(o => o.Status == OrderStatus.Completed || o.PaymentStatus == PaymentStatus.Paid)
            .Sum(o => o.TotalAmount);

        var tables = await _tableRepository.QueryNoTracking()
            .Where(t => t.RestaurantId == restaurantId.Value && !t.IsDeleted && t.IsActive)
            .ToListAsync(cancellationToken);

        var lowStockCount = await _inventoryItemRepository.CountAsync(
            i => i.RestaurantId == restaurantId.Value && !i.IsDeleted && i.CurrentStock <= i.MinStock,
            cancellationToken);

        var pendingOrders = todayOrders.Count(o => o.Status == OrderStatus.Pending);
        var preparingOrders = todayOrders.Count(o => o.Status == OrderStatus.Preparing);
        var readyOrders = todayOrders.Count(o => o.Status == OrderStatus.Ready);

        var stats = new DashboardStatsDto
        {
            TodayOrders = todayOrders.Count,
            TodayRevenue = todayRevenue,
            ActiveTables = tables.Count(t => t.Status == TableStatus.Occupied),
            TotalTables = tables.Count,
            LowStockItems = lowStockCount,
            PendingOrders = pendingOrders,
            PreparingOrders = preparingOrders,
            ReadyOrders = readyOrders
        };

        return ApiResponse<DashboardStatsDto>.Ok(stats);
    }

    private async Task DeductStockForOrderAsync(Order order, CancellationToken cancellationToken)
    {
        var orderItems = await _orderItemRepository.FindAsync(
            oi => oi.OrderId == order.Id, cancellationToken);

        foreach (var orderItem in orderItems)
        {
            var ingredients = await _dishIngredientRepository.FindAsync(
                di => di.MenuItemId == orderItem.MenuItemId, cancellationToken);

            foreach (var ingredient in ingredients)
            {
                var inventoryItem = await _inventoryItemRepository.GetByIdAsync(ingredient.InventoryItemId, cancellationToken);
                if (inventoryItem == null) continue;

                var totalRequired = ingredient.QuantityRequired * orderItem.Quantity;
                var previousStock = inventoryItem.CurrentStock;
                inventoryItem.CurrentStock = Math.Max(0, inventoryItem.CurrentStock - totalRequired);
                inventoryItem.UpdatedAt = DateTime.UtcNow;
                _inventoryItemRepository.Update(inventoryItem);

                var movement = new StockMovement
                {
                    InventoryItemId = inventoryItem.Id,
                    TenantId = order.TenantId,
                    MovementType = StockMovementType.OrderDeduction,
                    Quantity = totalRequired,
                    PreviousStock = previousStock,
                    NewStock = inventoryItem.CurrentStock,
                    ReferenceId = order.Id,
                    ReferenceType = "Order",
                    Notes = $"Auto-deduction for order {order.OrderNumber}",
                    CreatedBy = _currentUser.UserId
                };

                await _stockMovementRepository.AddAsync(movement, cancellationToken);
            }
        }
    }
}
