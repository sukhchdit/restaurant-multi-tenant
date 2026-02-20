using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.DTOs.Payment;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly IRepository<Payment> _paymentRepository;
    private readonly IRepository<PaymentSplit> _paymentSplitRepository;
    private readonly IRepository<Order> _orderRepository;
    private readonly IRepository<Refund> _refundRepository;
    private readonly IRepository<Invoice> _invoiceRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public PaymentService(
        IRepository<Payment> paymentRepository,
        IRepository<PaymentSplit> paymentSplitRepository,
        IRepository<Order> orderRepository,
        IRepository<Refund> refundRepository,
        IRepository<Invoice> invoiceRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _paymentRepository = paymentRepository;
        _paymentSplitRepository = paymentSplitRepository;
        _orderRepository = orderRepository;
        _refundRepository = refundRepository;
        _invoiceRepository = invoiceRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PaymentDto>> ProcessPaymentAsync(ProcessPaymentDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.GetByIdAsync(dto.OrderId, cancellationToken);
        if (order == null || order.IsDeleted)
            return ApiResponse<PaymentDto>.Fail("Order not found.", 404);

        if (order.PaymentStatus == PaymentStatus.Paid)
            return ApiResponse<PaymentDto>.Fail("Order is already paid.");

        if (dto.Amount <= 0)
            return ApiResponse<PaymentDto>.Fail("Payment amount must be greater than zero.");

        var payment = new Payment
        {
            OrderId = dto.OrderId,
            TenantId = order.TenantId,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            TransactionId = dto.TransactionId,
            Status = PaymentStatus.Paid,
            PaidAt = DateTime.UtcNow,
            CreatedBy = _currentUser.UserId
        };

        await _paymentRepository.AddAsync(payment, cancellationToken);

        // Check total paid
        var existingPayments = await _paymentRepository.FindAsync(
            p => p.OrderId == dto.OrderId && p.Status == PaymentStatus.Paid && !p.IsDeleted, cancellationToken);

        var totalPaid = existingPayments.Sum(p => p.Amount) + dto.Amount;

        if (totalPaid >= order.TotalAmount)
        {
            order.PaymentStatus = PaymentStatus.Paid;
            order.PaymentMethod = dto.PaymentMethod;
        }
        else
        {
            order.PaymentStatus = PaymentStatus.PartiallyPaid;
        }

        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = _currentUser.UserId;
        _orderRepository.Update(order);

        // Sync invoice payment status
        await SyncInvoicePaymentStatusAsync(dto.OrderId, order.PaymentStatus, dto.PaymentMethod, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<PaymentDto>(payment);
        result.OrderNumber = order.OrderNumber;

        return ApiResponse<PaymentDto>.Ok(result, "Payment processed successfully.");
    }

    public async Task<ApiResponse<PaymentDto>> SplitPaymentAsync(SplitPaymentDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.GetByIdAsync(dto.OrderId, cancellationToken);
        if (order == null || order.IsDeleted)
            return ApiResponse<PaymentDto>.Fail("Order not found.", 404);

        if (order.PaymentStatus == PaymentStatus.Paid)
            return ApiResponse<PaymentDto>.Fail("Order is already paid.");

        var totalSplitAmount = dto.Splits.Sum(s => s.Amount);
        if (totalSplitAmount <= 0)
            return ApiResponse<PaymentDto>.Fail("Total split amount must be greater than zero.");

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var payment = new Payment
            {
                OrderId = dto.OrderId,
                TenantId = order.TenantId,
                Amount = totalSplitAmount,
                PaymentMethod = dto.Splits.First().PaymentMethod,
                Status = PaymentStatus.Paid,
                PaidAt = DateTime.UtcNow,
                Notes = "Split payment",
                CreatedBy = _currentUser.UserId
            };

            await _paymentRepository.AddAsync(payment, cancellationToken);

            var splits = dto.Splits.Select(s => new PaymentSplit
            {
                PaymentId = payment.Id,
                Amount = s.Amount,
                PaymentMethod = s.PaymentMethod,
                TransactionId = s.TransactionId,
                PaidBy = s.PaidBy
            }).ToList();

            await _paymentSplitRepository.AddRangeAsync(splits, cancellationToken);

            // Update order payment status
            var existingPayments = await _paymentRepository.FindAsync(
                p => p.OrderId == dto.OrderId && p.Status == PaymentStatus.Paid && !p.IsDeleted, cancellationToken);

            var totalPaid = existingPayments.Sum(p => p.Amount) + totalSplitAmount;

            if (totalPaid >= order.TotalAmount)
            {
                order.PaymentStatus = PaymentStatus.Paid;
            }
            else
            {
                order.PaymentStatus = PaymentStatus.PartiallyPaid;
            }

            order.UpdatedAt = DateTime.UtcNow;
            order.UpdatedBy = _currentUser.UserId;
            _orderRepository.Update(order);

            // Sync invoice payment status
            await SyncInvoicePaymentStatusAsync(dto.OrderId, order.PaymentStatus, null, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitAsync(cancellationToken);

            var result = _mapper.Map<PaymentDto>(payment);
            result.OrderNumber = order.OrderNumber;
            result.Splits = _mapper.Map<List<PaymentSplitDto>>(splits);

            return ApiResponse<PaymentDto>.Ok(result, "Split payment processed successfully.");
        }
        catch
        {
            await _unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<ApiResponse<RefundResponseDto>> RefundAsync(RefundDto dto, CancellationToken cancellationToken = default)
    {
        var payment = await _paymentRepository.Query()
            .Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.Id == dto.PaymentId && !p.IsDeleted, cancellationToken);

        if (payment == null)
            return ApiResponse<RefundResponseDto>.Fail("Payment not found.", 404);

        if (payment.Status != PaymentStatus.Paid)
            return ApiResponse<RefundResponseDto>.Fail("Can only refund a paid payment.");

        if (dto.Amount <= 0 || dto.Amount > payment.Amount)
            return ApiResponse<RefundResponseDto>.Fail("Refund amount must be between 0 and the payment amount.");

        // Check existing refunds
        var existingRefunds = await _refundRepository.FindAsync(
            r => r.PaymentId == dto.PaymentId && r.Status != RefundStatus.Rejected && !r.IsDeleted, cancellationToken);
        var totalRefunded = existingRefunds.Sum(r => r.Amount);

        if (totalRefunded + dto.Amount > payment.Amount)
            return ApiResponse<RefundResponseDto>.Fail("Total refund amount exceeds the payment amount.");

        var refund = new Refund
        {
            PaymentId = dto.PaymentId,
            OrderId = payment.OrderId,
            TenantId = payment.TenantId,
            Amount = dto.Amount,
            Reason = dto.Reason,
            Status = RefundStatus.Pending,
            CreatedBy = _currentUser.UserId
        };

        await _refundRepository.AddAsync(refund, cancellationToken);

        // Update order payment status
        if (totalRefunded + dto.Amount >= payment.Amount)
        {
            payment.Order.PaymentStatus = PaymentStatus.Refunded;
            _orderRepository.Update(payment.Order);

            // Sync invoice payment status
            await SyncInvoicePaymentStatusAsync(payment.OrderId, PaymentStatus.Refunded, null, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = new RefundResponseDto
        {
            Id = refund.Id,
            PaymentId = refund.PaymentId,
            OrderId = refund.OrderId,
            Amount = refund.Amount,
            Reason = refund.Reason,
            Status = refund.Status,
            CreatedAt = refund.CreatedAt
        };

        return ApiResponse<RefundResponseDto>.Ok(result, "Refund request created.");
    }

    public async Task<ApiResponse<PaginatedResultDto<PaymentDto>>> GetPaymentsAsync(
        int pageNumber = 1, int pageSize = 20, Guid? orderId = null, string? search = null,
        CancellationToken cancellationToken = default)
    {
        var tenantId = _currentUser.TenantId;
        if (tenantId == null)
            return ApiResponse<PaginatedResultDto<PaymentDto>>.Fail("Tenant context not found.", 403);

        var query = _paymentRepository.QueryNoTracking()
            .Include(p => p.Order)
            .Where(p => p.TenantId == tenantId.Value && !p.IsDeleted);

        if (orderId.HasValue)
            query = query.Where(p => p.OrderId == orderId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = $"%{search}%";
            query = query.Where(p =>
                EF.Functions.Like(p.Order.OrderNumber, term) ||
                (p.TransactionId != null && EF.Functions.Like(p.TransactionId, term)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var payments = await query
            .Include(p => p.PaymentSplits)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = _mapper.Map<List<PaymentDto>>(payments);
        var result = new PaginatedResultDto<PaymentDto>(dtos, totalCount, pageNumber, pageSize);

        return ApiResponse<PaginatedResultDto<PaymentDto>>.Ok(result);
    }

    private async Task SyncInvoicePaymentStatusAsync(Guid orderId, PaymentStatus status, PaymentMethod? paymentMethod, CancellationToken cancellationToken)
    {
        var invoice = await _invoiceRepository.Query()
            .FirstOrDefaultAsync(i => i.OrderId == orderId && !i.IsDeleted, cancellationToken);

        if (invoice != null)
        {
            invoice.PaymentStatus = status;
            if (paymentMethod.HasValue)
                invoice.PaymentMethod = paymentMethod.Value;
            invoice.UpdatedAt = DateTime.UtcNow;
            invoice.UpdatedBy = _currentUser.UserId;
            _invoiceRepository.Update(invoice);
        }
    }
}
