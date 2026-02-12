using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Table;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class TableService : ITableService
{
    private readonly IRepository<RestaurantTable> _tableRepository;
    private readonly IRepository<TableReservation> _reservationRepository;
    private readonly IRepository<Branch> _branchRepository;
    private readonly IRepository<Order> _orderRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public TableService(
        IRepository<RestaurantTable> tableRepository,
        IRepository<TableReservation> reservationRepository,
        IRepository<Branch> branchRepository,
        IRepository<Order> orderRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _tableRepository = tableRepository;
        _reservationRepository = reservationRepository;
        _branchRepository = branchRepository;
        _orderRepository = orderRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApiResponse<List<TableDto>>> GetTablesAsync(bool availableOnly = false, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<List<TableDto>>.Fail("Restaurant context not found.", 403);

        var query = _tableRepository.QueryNoTracking()
            .Where(t => t.RestaurantId == restaurantId.Value && !t.IsDeleted);

        if (availableOnly)
        {
            // Exclude tables that have any active (non-completed, non-cancelled) order
            var tablesWithActiveOrders = _orderRepository.QueryNoTracking()
                .Where(o => o.TableId != null && !o.IsDeleted
                            && o.Status != OrderStatus.Completed
                            && o.Status != OrderStatus.Cancelled)
                .Select(o => o.TableId!.Value);

            query = query.Where(t => t.Status == TableStatus.Available
                                     && !tablesWithActiveOrders.Contains(t.Id));
        }

        var tables = await query
            .OrderBy(t => t.FloorNumber)
            .ThenBy(t => t.Section)
            .ThenBy(t => t.TableNumber)
            .ToListAsync(cancellationToken);

        var result = _mapper.Map<List<TableDto>>(tables);
        return ApiResponse<List<TableDto>>.Ok(result);
    }

    public async Task<ApiResponse<TableDto>> CreateTableAsync(CreateTableDto dto, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<TableDto>.Fail("Restaurant context not found.", 403);

        var existing = await _tableRepository.AnyAsync(
            t => t.RestaurantId == restaurantId.Value && t.TableNumber == dto.TableNumber && !t.IsDeleted,
            cancellationToken);
        if (existing)
            return ApiResponse<TableDto>.Fail($"Table number '{dto.TableNumber}' already exists.");

        // Get default branch
        var branch = await _branchRepository.FirstOrDefaultAsync(
            b => b.RestaurantId == restaurantId.Value && !b.IsDeleted, cancellationToken);

        var table = new RestaurantTable
        {
            RestaurantId = restaurantId.Value,
            BranchId = branch?.Id ?? Guid.Empty,
            TenantId = _currentUser.TenantId ?? Guid.Empty,
            TableNumber = dto.TableNumber,
            Capacity = dto.Capacity,
            FloorNumber = dto.FloorNumber,
            Section = dto.Section,
            PositionX = dto.PositionX,
            PositionY = dto.PositionY,
            Status = TableStatus.Available,
            IsActive = true,
            CreatedBy = _currentUser.UserId
        };

        await _tableRepository.AddAsync(table, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<TableDto>(table);
        return ApiResponse<TableDto>.Ok(result, "Table created successfully.");
    }

    public async Task<ApiResponse<TableDto>> UpdateTableAsync(Guid id, CreateTableDto dto, CancellationToken cancellationToken = default)
    {
        var table = await _tableRepository.GetByIdAsync(id, cancellationToken);
        if (table == null || table.IsDeleted)
            return ApiResponse<TableDto>.Fail("Table not found.", 404);

        var duplicate = await _tableRepository.AnyAsync(
            t => t.RestaurantId == table.RestaurantId && t.TableNumber == dto.TableNumber
                 && t.Id != id && !t.IsDeleted, cancellationToken);
        if (duplicate)
            return ApiResponse<TableDto>.Fail($"Table number '{dto.TableNumber}' already exists.");

        table.TableNumber = dto.TableNumber;
        table.Capacity = dto.Capacity;
        table.FloorNumber = dto.FloorNumber;
        table.Section = dto.Section;
        table.PositionX = dto.PositionX;
        table.PositionY = dto.PositionY;
        table.UpdatedAt = DateTime.UtcNow;
        table.UpdatedBy = _currentUser.UserId;

        _tableRepository.Update(table);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<TableDto>(table);
        return ApiResponse<TableDto>.Ok(result, "Table updated successfully.");
    }

    public async Task<ApiResponse<TableDto>> UpdateStatusAsync(Guid id, UpdateTableStatusDto dto, CancellationToken cancellationToken = default)
    {
        var table = await _tableRepository.GetByIdAsync(id, cancellationToken);
        if (table == null || table.IsDeleted)
            return ApiResponse<TableDto>.Fail("Table not found.", 404);

        table.Status = dto.Status;
        table.UpdatedAt = DateTime.UtcNow;
        table.UpdatedBy = _currentUser.UserId;

        _tableRepository.Update(table);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<TableDto>(table);
        return ApiResponse<TableDto>.Ok(result, "Table status updated.");
    }

    public async Task<ApiResponse<TableDto>> AssignAsync(Guid id, Guid orderId, CancellationToken cancellationToken = default)
    {
        var table = await _tableRepository.GetByIdAsync(id, cancellationToken);
        if (table == null || table.IsDeleted)
            return ApiResponse<TableDto>.Fail("Table not found.", 404);

        if (table.Status == TableStatus.Occupied)
            return ApiResponse<TableDto>.Fail("Table is already occupied.");

        table.Status = TableStatus.Occupied;
        table.CurrentOrderId = orderId;
        table.UpdatedAt = DateTime.UtcNow;
        table.UpdatedBy = _currentUser.UserId;

        _tableRepository.Update(table);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<TableDto>(table);
        return ApiResponse<TableDto>.Ok(result, "Table assigned successfully.");
    }

    public async Task<ApiResponse<TableDto>> FreeAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var table = await _tableRepository.GetByIdAsync(id, cancellationToken);
        if (table == null || table.IsDeleted)
            return ApiResponse<TableDto>.Fail("Table not found.", 404);

        table.Status = TableStatus.Available;
        table.CurrentOrderId = null;
        table.UpdatedAt = DateTime.UtcNow;
        table.UpdatedBy = _currentUser.UserId;

        _tableRepository.Update(table);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<TableDto>(table);
        return ApiResponse<TableDto>.Ok(result, "Table freed successfully.");
    }

    public async Task<ApiResponse<string>> GetQRCodeAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var table = await _tableRepository.GetByIdAsync(id, cancellationToken);
        if (table == null || table.IsDeleted)
            return ApiResponse<string>.Fail("Table not found.", 404);

        if (string.IsNullOrEmpty(table.QRCodeUrl))
        {
            // Generate QR code URL
            var qrUrl = $"/api/public/menu/{table.RestaurantId}?table={table.TableNumber}";
            table.QRCodeUrl = qrUrl;
            table.UpdatedAt = DateTime.UtcNow;
            _tableRepository.Update(table);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return ApiResponse<string>.Ok(table.QRCodeUrl);
    }

    public async Task<ApiResponse<List<TableReservationDto>>> GetReservationsAsync(DateOnly? date = null, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<List<TableReservationDto>>.Fail("Restaurant context not found.", 403);

        var query = _reservationRepository.QueryNoTracking()
            .Include(r => r.Table)
            .Where(r => r.Table.RestaurantId == restaurantId.Value && !r.IsDeleted);

        if (date.HasValue)
            query = query.Where(r => r.ReservationDate == date.Value);
        else
            query = query.Where(r => r.ReservationDate >= DateOnly.FromDateTime(DateTime.UtcNow));

        var reservations = await query
            .OrderBy(r => r.ReservationDate)
            .ThenBy(r => r.ReservationTime)
            .ToListAsync(cancellationToken);

        var result = _mapper.Map<List<TableReservationDto>>(reservations);
        return ApiResponse<List<TableReservationDto>>.Ok(result);
    }

    public async Task<ApiResponse<TableReservationDto>> CreateReservationAsync(CreateReservationDto dto, CancellationToken cancellationToken = default)
    {
        var table = await _tableRepository.GetByIdAsync(dto.TableId, cancellationToken);
        if (table == null || table.IsDeleted)
            return ApiResponse<TableReservationDto>.Fail("Table not found.", 404);

        if (dto.PartySize > table.Capacity)
            return ApiResponse<TableReservationDto>.Fail($"Party size ({dto.PartySize}) exceeds table capacity ({table.Capacity}).");

        // Check for conflicting reservations
        var conflicting = await _reservationRepository.AnyAsync(r =>
            r.TableId == dto.TableId
            && r.ReservationDate == dto.ReservationDate
            && !r.IsDeleted
            && r.Status != ReservationStatus.Cancelled
            && r.Status != ReservationStatus.NoShow
            && r.ReservationTime < dto.ReservationTime.AddMinutes(dto.Duration)
            && dto.ReservationTime < r.ReservationTime.AddMinutes(r.Duration),
            cancellationToken);

        if (conflicting)
            return ApiResponse<TableReservationDto>.Fail("There is a conflicting reservation for this table at the requested time.");

        var reservation = new TableReservation
        {
            TableId = dto.TableId,
            TenantId = _currentUser.TenantId ?? Guid.Empty,
            CustomerName = dto.CustomerName,
            CustomerPhone = dto.CustomerPhone,
            CustomerId = dto.CustomerId,
            PartySize = dto.PartySize,
            ReservationDate = dto.ReservationDate,
            ReservationTime = dto.ReservationTime,
            Duration = dto.Duration,
            Status = ReservationStatus.Pending,
            Notes = dto.Notes,
            CreatedBy = _currentUser.UserId
        };

        await _reservationRepository.AddAsync(reservation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<TableReservationDto>(reservation);
        result.TableNumber = table.TableNumber;

        return ApiResponse<TableReservationDto>.Ok(result, "Reservation created successfully.");
    }
}
