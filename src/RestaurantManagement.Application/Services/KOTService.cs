using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.KOT;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class KOTService : IKOTService
{
    private readonly IRepository<KitchenOrderTicket> _kotRepository;
    private readonly IRepository<KOTItem> _kotItemRepository;
    private readonly IRepository<Order> _orderRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public KOTService(
        IRepository<KitchenOrderTicket> kotRepository,
        IRepository<KOTItem> kotItemRepository,
        IRepository<Order> orderRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _kotRepository = kotRepository;
        _kotItemRepository = kotItemRepository;
        _orderRepository = orderRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApiResponse<List<KOTDto>>> GetActiveKOTsAsync(CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<List<KOTDto>>.Fail("Restaurant context not found.", 403);

        var todayStart = DateTime.UtcNow.Date;
        var tomorrowStart = todayStart.AddDays(1);

        var kots = await _kotRepository.Query()
            .Where(k => k.RestaurantId == restaurantId.Value && !k.IsDeleted
                        && (k.Status == KOTStatus.Sent || k.Status == KOTStatus.Acknowledged
                            || k.Status == KOTStatus.Preparing || k.Status == KOTStatus.Ready)
                        && k.CreatedAt >= todayStart && k.CreatedAt < tomorrowStart)
            .Include(k => k.KOTItems)
            .Include(k => k.Order)
            .Include(k => k.AssignedChef)
            .OrderByDescending(k => k.Priority)
            .ThenBy(k => k.SentAt)
            .ToListAsync(cancellationToken);

        // Auto-priority: increase priority for KOTs waiting more than 15 minutes
        foreach (var kot in kots)
        {
            if (kot.SentAt.HasValue && kot.Status == KOTStatus.Sent)
            {
                var elapsed = DateTime.UtcNow - kot.SentAt.Value;
                if (elapsed.TotalMinutes > 30)
                    kot.Priority = Math.Max(kot.Priority, 3);
                else if (elapsed.TotalMinutes > 15)
                    kot.Priority = Math.Max(kot.Priority, 2);
                else if (elapsed.TotalMinutes > 10)
                    kot.Priority = Math.Max(kot.Priority, 1);

                _kotRepository.Update(kot);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<List<KOTDto>>(kots.OrderByDescending(k => k.Priority).ThenBy(k => k.SentAt));
        return ApiResponse<List<KOTDto>>.Ok(result);
    }

    public async Task<ApiResponse<KOTDto>> AcknowledgeAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var kot = await _kotRepository.Query()
            .Include(k => k.KOTItems)
            .Include(k => k.Order)
            .Include(k => k.AssignedChef)
            .FirstOrDefaultAsync(k => k.Id == id && !k.IsDeleted, cancellationToken);

        if (kot == null)
            return ApiResponse<KOTDto>.Fail("KOT not found.", 404);

        if (kot.Status != KOTStatus.Sent)
            return ApiResponse<KOTDto>.Fail($"KOT cannot be acknowledged from status {kot.Status}. Expected: Sent.");

        kot.Status = KOTStatus.Acknowledged;
        kot.AcknowledgedAt = DateTime.UtcNow;
        kot.UpdatedAt = DateTime.UtcNow;
        kot.UpdatedBy = _currentUser.UserId;

        foreach (var item in kot.KOTItems)
        {
            item.Status = KOTStatus.Acknowledged;
            item.UpdatedAt = DateTime.UtcNow;
        }

        _kotRepository.Update(kot);
        _kotItemRepository.UpdateRange(kot.KOTItems);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<KOTDto>(kot);
        return ApiResponse<KOTDto>.Ok(result, "KOT acknowledged.");
    }

    public async Task<ApiResponse<KOTDto>> StartPreparingAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var kot = await _kotRepository.Query()
            .Include(k => k.KOTItems)
            .Include(k => k.Order)
            .Include(k => k.AssignedChef)
            .FirstOrDefaultAsync(k => k.Id == id && !k.IsDeleted, cancellationToken);

        if (kot == null)
            return ApiResponse<KOTDto>.Fail("KOT not found.", 404);

        if (kot.Status != KOTStatus.Sent && kot.Status != KOTStatus.Acknowledged)
            return ApiResponse<KOTDto>.Fail($"KOT cannot start preparing from status {kot.Status}. Expected: Sent or Acknowledged.");

        kot.Status = KOTStatus.Preparing;
        kot.AcknowledgedAt ??= DateTime.UtcNow;
        kot.StartedAt = DateTime.UtcNow;
        kot.UpdatedAt = DateTime.UtcNow;
        kot.UpdatedBy = _currentUser.UserId;

        foreach (var item in kot.KOTItems)
        {
            item.Status = KOTStatus.Preparing;
            item.UpdatedAt = DateTime.UtcNow;
        }

        // Also update order status to Preparing (from Pending or Confirmed)
        var order = await _orderRepository.GetByIdAsync(kot.OrderId, cancellationToken);
        if (order != null && (order.Status == OrderStatus.Pending || order.Status == OrderStatus.Confirmed))
        {
            order.Status = OrderStatus.Preparing;
            order.UpdatedAt = DateTime.UtcNow;
            _orderRepository.Update(order);
        }

        _kotRepository.Update(kot);
        _kotItemRepository.UpdateRange(kot.KOTItems);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<KOTDto>(kot);
        return ApiResponse<KOTDto>.Ok(result, "KOT is now being prepared.");
    }

    public async Task<ApiResponse<KOTDto>> MarkReadyAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var kot = await _kotRepository.Query()
            .Include(k => k.KOTItems)
            .Include(k => k.Order)
            .Include(k => k.AssignedChef)
            .FirstOrDefaultAsync(k => k.Id == id && !k.IsDeleted, cancellationToken);

        if (kot == null)
            return ApiResponse<KOTDto>.Fail("KOT not found.", 404);

        if (kot.Status != KOTStatus.Preparing)
            return ApiResponse<KOTDto>.Fail($"KOT cannot be marked ready from status {kot.Status}. Expected: Preparing.");

        kot.Status = KOTStatus.Ready;
        kot.CompletedAt = DateTime.UtcNow;
        kot.UpdatedAt = DateTime.UtcNow;
        kot.UpdatedBy = _currentUser.UserId;

        foreach (var item in kot.KOTItems)
        {
            item.Status = KOTStatus.Ready;
            item.UpdatedAt = DateTime.UtcNow;
        }

        // Check if all KOTs for this order are ready
        var allKotsForOrder = await _kotRepository.FindAsync(
            k => k.OrderId == kot.OrderId && !k.IsDeleted && k.Id != kot.Id, cancellationToken);

        var allReady = allKotsForOrder.All(k => k.Status == KOTStatus.Ready);

        if (allReady)
        {
            var order = await _orderRepository.GetByIdAsync(kot.OrderId, cancellationToken);
            if (order != null && order.Status == OrderStatus.Preparing)
            {
                order.Status = OrderStatus.Ready;
                order.UpdatedAt = DateTime.UtcNow;
                _orderRepository.Update(order);
            }
        }

        _kotRepository.Update(kot);
        _kotItemRepository.UpdateRange(kot.KOTItems);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<KOTDto>(kot);
        return ApiResponse<KOTDto>.Ok(result, "KOT is ready.");
    }

    public async Task<ApiResponse<KOTDto>> MarkPrintedAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var kot = await _kotRepository.Query()
            .Include(k => k.KOTItems)
            .Include(k => k.Order)
            .Include(k => k.AssignedChef)
            .FirstOrDefaultAsync(k => k.Id == id && !k.IsDeleted, cancellationToken);

        if (kot == null)
            return ApiResponse<KOTDto>.Fail("KOT not found.", 404);

        kot.PrintCount += 1;
        kot.PrintedAt = DateTime.UtcNow;
        kot.UpdatedAt = DateTime.UtcNow;
        kot.UpdatedBy = _currentUser.UserId;

        _kotRepository.Update(kot);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<KOTDto>(kot);
        return ApiResponse<KOTDto>.Ok(result, "KOT marked as printed.");
    }
}
