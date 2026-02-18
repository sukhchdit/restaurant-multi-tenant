using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Account;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class AccountService : IAccountService
{
    private readonly IRepository<LedgerEntry> _ledgerRepository;
    private readonly IRepository<DailySettlement> _settlementRepository;
    private readonly IRepository<Order> _orderRepository;
    private readonly IRepository<Payment> _paymentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public AccountService(
        IRepository<LedgerEntry> ledgerRepository,
        IRepository<DailySettlement> settlementRepository,
        IRepository<Order> orderRepository,
        IRepository<Payment> paymentRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser)
    {
        _ledgerRepository = ledgerRepository;
        _settlementRepository = settlementRepository;
        _orderRepository = orderRepository;
        _paymentRepository = paymentRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<List<LedgerEntryDto>>> GetLedgerAsync(
        string? type = null, string? dateFrom = null, string? dateTo = null,
        CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<List<LedgerEntryDto>>.Fail("Restaurant context not found.", 403);

        var query = _ledgerRepository.QueryNoTracking()
            .Where(le => le.RestaurantId == restaurantId.Value && !le.IsDeleted);

        if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<LedgerType>(type, true, out var ledgerType))
            query = query.Where(le => le.LedgerType == ledgerType);

        if (DateOnly.TryParse(dateFrom, out var from))
            query = query.Where(le => le.EntryDate >= from);

        if (DateOnly.TryParse(dateTo, out var to))
            query = query.Where(le => le.EntryDate <= to);

        var entries = await query
            .OrderByDescending(le => le.EntryDate)
            .ThenByDescending(le => le.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = entries.Select(le => new LedgerEntryDto
        {
            Id = le.Id,
            Date = le.EntryDate,
            Description = le.Description ?? string.Empty,
            Type = le.LedgerType == LedgerType.Income ? "income" : "expense",
            Category = le.Category,
            Amount = le.Amount,
            PaymentMethod = le.ReferenceType,
            Reference = le.ReferenceId?.ToString(),
            CreatedAt = le.CreatedAt
        }).ToList();

        return ApiResponse<List<LedgerEntryDto>>.Ok(result);
    }

    public async Task<ApiResponse<LedgerEntryDto>> CreateLedgerEntryAsync(
        CreateLedgerEntryDto dto, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<LedgerEntryDto>.Fail("Restaurant context not found.", 403);

        var ledgerType = dto.Type.Equals("income", StringComparison.OrdinalIgnoreCase)
            ? LedgerType.Income
            : LedgerType.Expense;

        var entry = new LedgerEntry
        {
            TenantId = _currentUser.TenantId ?? Guid.Empty,
            RestaurantId = restaurantId.Value,
            EntryDate = DateOnly.FromDateTime(DateTime.UtcNow),
            LedgerType = ledgerType,
            Category = dto.Category,
            Description = dto.Description,
            Amount = dto.Amount,
            ReferenceType = dto.PaymentMethod,
            CreatedBy = _currentUser.UserId
        };

        await _ledgerRepository.AddAsync(entry, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = new LedgerEntryDto
        {
            Id = entry.Id,
            Date = entry.EntryDate,
            Description = entry.Description ?? string.Empty,
            Type = dto.Type.ToLower(),
            Category = entry.Category,
            Amount = entry.Amount,
            PaymentMethod = entry.ReferenceType,
            CreatedAt = entry.CreatedAt
        };

        return ApiResponse<LedgerEntryDto>.Ok(result, "Ledger entry created successfully.");
    }

    public async Task<ApiResponse<List<DailySettlementDto>>> GetSettlementsAsync(
        CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<List<DailySettlementDto>>.Fail("Restaurant context not found.", 403);

        var settlements = await _settlementRepository.QueryNoTracking()
            .Where(ds => ds.RestaurantId == restaurantId.Value && !ds.IsDeleted)
            .OrderByDescending(ds => ds.SettlementDate)
            .ToListAsync(cancellationToken);

        var result = settlements.Select(ds => new DailySettlementDto
        {
            Id = ds.Id,
            Date = ds.SettlementDate,
            TotalRevenue = ds.TotalRevenue,
            TotalExpenses = ds.TotalExpenses,
            CashInHand = ds.CashCollection,
            CardPayments = ds.CardCollection,
            OnlinePayments = ds.OnlineCollection,
            NetAmount = ds.NetAmount,
            TotalOrders = ds.TotalOrders,
            Status = ds.SettledBy.HasValue ? "settled" : "open",
            SettledBy = ds.SettledBy?.ToString()
        }).ToList();

        return ApiResponse<List<DailySettlementDto>>.Ok(result);
    }

    public async Task<ApiResponse<DailySettlementDto>> SettleDayAsync(
        string date, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<DailySettlementDto>.Fail("Restaurant context not found.", 403);

        if (!DateOnly.TryParse(date, out var settlementDate))
            return ApiResponse<DailySettlementDto>.Fail("Invalid date format.", 400);

        // Check if already settled
        var existing = await _settlementRepository.QueryNoTracking()
            .FirstOrDefaultAsync(ds => ds.RestaurantId == restaurantId.Value
                && ds.SettlementDate == settlementDate && !ds.IsDeleted, cancellationToken);

        if (existing?.SettledBy != null)
            return ApiResponse<DailySettlementDto>.Fail("This day has already been settled.", 400);

        // Calculate totals from orders for that day
        var dayStart = settlementDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var dayEnd = settlementDate.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var orders = await _orderRepository.QueryNoTracking()
            .Where(o => o.RestaurantId == restaurantId.Value && !o.IsDeleted
                && o.CreatedAt >= dayStart && o.CreatedAt < dayEnd)
            .ToListAsync(cancellationToken);

        var payments = await _paymentRepository.QueryNoTracking()
            .Include(p => p.Order)
            .Where(p => p.Order.RestaurantId == restaurantId.Value && !p.IsDeleted
                && p.CreatedAt >= dayStart && p.CreatedAt < dayEnd)
            .ToListAsync(cancellationToken);

        var totalRevenue = orders.Sum(o => o.TotalAmount);
        var cashCollection = payments.Where(p => p.PaymentMethod == Domain.Enums.PaymentMethod.Cash).Sum(p => p.Amount);
        var cardCollection = payments.Where(p => p.PaymentMethod == Domain.Enums.PaymentMethod.Card).Sum(p => p.Amount);
        var onlineCollection = payments.Where(p => p.PaymentMethod == Domain.Enums.PaymentMethod.Online).Sum(p => p.Amount);

        // Get expenses from ledger for that day
        var expenses = await _ledgerRepository.QueryNoTracking()
            .Where(le => le.RestaurantId == restaurantId.Value && !le.IsDeleted
                && le.EntryDate == settlementDate && le.LedgerType == LedgerType.Expense)
            .SumAsync(le => le.Amount, cancellationToken);

        if (existing != null)
        {
            // Update existing settlement
            var tracked = await _settlementRepository.GetByIdAsync(existing.Id, cancellationToken);
            tracked!.TotalOrders = orders.Count;
            tracked.TotalRevenue = totalRevenue;
            tracked.CashCollection = cashCollection;
            tracked.CardCollection = cardCollection;
            tracked.OnlineCollection = onlineCollection;
            tracked.TotalExpenses = expenses;
            tracked.NetAmount = totalRevenue - expenses;
            tracked.SettledBy = _currentUser.UserId;
            tracked.UpdatedAt = DateTime.UtcNow;
            _settlementRepository.Update(tracked);
        }
        else
        {
            // Create new settlement
            var settlement = new DailySettlement
            {
                TenantId = _currentUser.TenantId ?? Guid.Empty,
                RestaurantId = restaurantId.Value,
                SettlementDate = settlementDate,
                TotalOrders = orders.Count,
                TotalRevenue = totalRevenue,
                CashCollection = cashCollection,
                CardCollection = cardCollection,
                OnlineCollection = onlineCollection,
                TotalExpenses = expenses,
                NetAmount = totalRevenue - expenses,
                SettledBy = _currentUser.UserId,
                CreatedBy = _currentUser.UserId
            };
            await _settlementRepository.AddAsync(settlement, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = new DailySettlementDto
        {
            Date = settlementDate,
            TotalRevenue = totalRevenue,
            TotalExpenses = expenses,
            CashInHand = cashCollection,
            CardPayments = cardCollection,
            OnlinePayments = onlineCollection,
            NetAmount = totalRevenue - expenses,
            TotalOrders = orders.Count,
            Status = "settled",
            SettledBy = _currentUser.UserId?.ToString()
        };

        return ApiResponse<DailySettlementDto>.Ok(result, "Day settled successfully.");
    }

    public async Task CreateRevenueEntryAsync(Guid orderId, decimal amount, string paymentMethod,
        string orderNumber, CancellationToken ct = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null) return;

        // Prevent duplicate ledger entries for the same order
        var exists = await _ledgerRepository.QueryNoTracking()
            .AnyAsync(le => le.ReferenceId == orderId && !le.IsDeleted, ct);
        if (exists) return;

        var entry = new LedgerEntry
        {
            TenantId = _currentUser.TenantId ?? Guid.Empty,
            RestaurantId = restaurantId.Value,
            EntryDate = DateOnly.FromDateTime(DateTime.UtcNow),
            LedgerType = LedgerType.Income,
            Category = "Sales Revenue",
            Description = $"Payment for Order #{orderNumber}",
            Amount = amount,
            ReferenceId = orderId,
            ReferenceType = paymentMethod,
            CreatedBy = _currentUser.UserId
        };

        await _ledgerRepository.AddAsync(entry, ct);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
