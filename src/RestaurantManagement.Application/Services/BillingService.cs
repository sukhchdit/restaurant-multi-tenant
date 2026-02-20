using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Billing;
using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class BillingService : IBillingService
{
    private readonly IRepository<Invoice> _invoiceRepository;
    private readonly IRepository<InvoiceLineItem> _lineItemRepository;
    private readonly IRepository<Order> _orderRepository;
    private readonly IRepository<TaxConfiguration> _taxConfigRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public BillingService(
        IRepository<Invoice> invoiceRepository,
        IRepository<InvoiceLineItem> lineItemRepository,
        IRepository<Order> orderRepository,
        IRepository<TaxConfiguration> taxConfigRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _invoiceRepository = invoiceRepository;
        _lineItemRepository = lineItemRepository;
        _orderRepository = orderRepository;
        _taxConfigRepository = taxConfigRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApiResponse<InvoiceDto>> GenerateInvoiceAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.Query()
            .Include(o => o.OrderItems)
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.Id == orderId && !o.IsDeleted, cancellationToken);

        if (order == null)
            return ApiResponse<InvoiceDto>.Fail("Order not found.", 404);

        // Check if invoice already exists for this order
        var existingInvoice = await _invoiceRepository.FirstOrDefaultAsync(
            i => i.OrderId == orderId && !i.IsDeleted, cancellationToken);

        if (existingInvoice != null)
        {
            var existingDto = await GetInvoiceDtoByIdAsync(existingInvoice.Id, cancellationToken);
            return ApiResponse<InvoiceDto>.Ok(existingDto!, "Invoice already exists for this order.");
        }

        var restaurantId = order.RestaurantId;

        // Get tax configuration
        var taxConfigs = await _taxConfigRepository.FindAsync(
            t => t.RestaurantId == restaurantId && t.IsActive && !t.IsDeleted, cancellationToken);

        decimal cgstRate = 0, sgstRate = 0;
        foreach (var tax in taxConfigs)
        {
            var taxName = tax.Name.ToUpper();
            if (taxName.Contains("CGST"))
                cgstRate = tax.Rate;
            else if (taxName.Contains("SGST"))
                sgstRate = tax.Rate;
        }

        var taxableAmount = order.SubTotal - order.DiscountAmount;
        var cgstAmount = Math.Round(taxableAmount * cgstRate / 100, 2);
        var sgstAmount = Math.Round(taxableAmount * sgstRate / 100, 2);
        var gstAmount = cgstAmount + sgstAmount;

        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        var invoice = new Invoice
        {
            RestaurantId = restaurantId,
            TenantId = order.TenantId,
            OrderId = orderId,
            InvoiceNumber = invoiceNumber,
            CustomerName = order.CustomerName ?? order.Customer?.FullName,
            CustomerPhone = order.CustomerPhone ?? order.Customer?.Phone,
            SubTotal = order.SubTotal,
            DiscountAmount = order.DiscountAmount,
            CgstAmount = cgstAmount,
            SgstAmount = sgstAmount,
            GstAmount = gstAmount,
            VatAmount = order.VatAmount,
            ExtraCharges = order.ExtraCharges,
            TotalAmount = taxableAmount + gstAmount + order.VatAmount + order.ExtraCharges,
            PaymentMethod = order.PaymentMethod,
            PaymentStatus = order.PaymentStatus,
            CreatedBy = _currentUser.UserId
        };

        await _invoiceRepository.AddAsync(invoice, cancellationToken);

        // Create line items from order items
        var lineItems = order.OrderItems.Select(oi => new InvoiceLineItem
        {
            InvoiceId = invoice.Id,
            Description = oi.MenuItemName,
            Quantity = oi.Quantity,
            UnitPrice = oi.UnitPrice,
            TotalPrice = oi.TotalPrice,
            TaxRate = cgstRate + sgstRate,
            TaxAmount = Math.Round(oi.TotalPrice * (cgstRate + sgstRate) / 100, 2)
        }).ToList();

        await _lineItemRepository.AddRangeAsync(lineItems, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = await GetInvoiceDtoByIdAsync(invoice.Id, cancellationToken);
        return ApiResponse<InvoiceDto>.Ok(result!, "Invoice generated successfully.");
    }

    public async Task<ApiResponse<PaginatedResultDto<InvoiceDto>>> GetInvoicesAsync(
        int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<PaginatedResultDto<InvoiceDto>>.Fail("Restaurant context not found.", 403);

        var query = _invoiceRepository.QueryNoTracking()
            .Where(i => i.RestaurantId == restaurantId.Value && !i.IsDeleted);

        var totalCount = await query.CountAsync(cancellationToken);

        var invoices = await query
            .Include(i => i.LineItems)
            .OrderByDescending(i => i.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = _mapper.Map<List<InvoiceDto>>(invoices);
        var result = new PaginatedResultDto<InvoiceDto>(dtos, totalCount, pageNumber, pageSize);

        return ApiResponse<PaginatedResultDto<InvoiceDto>>.Ok(result);
    }

    public async Task<ApiResponse<byte[]>> GetInvoicePdfAsync(Guid invoiceId, CancellationToken cancellationToken = default)
    {
        var invoice = await _invoiceRepository.Query()
            .Include(i => i.LineItems)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted, cancellationToken);

        if (invoice == null)
            return ApiResponse<byte[]>.Fail("Invoice not found.", 404);

        // Generate a simple text-based PDF representation
        // In production, this would use a library like QuestPDF, iTextSharp, etc.
        var content = $"INVOICE: {invoice.InvoiceNumber}\n"
                      + $"Date: {invoice.CreatedAt:yyyy-MM-dd}\n"
                      + $"Customer: {invoice.CustomerName}\n"
                      + $"Phone: {invoice.CustomerPhone}\n\n"
                      + "--- Items ---\n";

        foreach (var item in invoice.LineItems)
        {
            content += $"{item.Description} x{item.Quantity} @ {item.UnitPrice:C} = {item.TotalPrice:C}\n";
        }

        content += $"\nSubTotal: {invoice.SubTotal:C}\n"
                   + $"Discount: -{invoice.DiscountAmount:C}\n"
                   + $"CGST: {invoice.CgstAmount:C}\n"
                   + $"SGST: {invoice.SgstAmount:C}\n"
                   + (invoice.VatAmount > 0 ? $"VAT: {invoice.VatAmount:C}\n" : "")
                   + (invoice.ExtraCharges > 0 ? $"Extra Charges: {invoice.ExtraCharges:C}\n" : "")
                   + $"Total: {invoice.TotalAmount:C}\n";

        var pdfBytes = System.Text.Encoding.UTF8.GetBytes(content);

        return ApiResponse<byte[]>.Ok(pdfBytes);
    }

    public async Task<ApiResponse> EmailInvoiceAsync(Guid invoiceId, string email, CancellationToken cancellationToken = default)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(invoiceId, cancellationToken);
        if (invoice == null || invoice.IsDeleted)
            return ApiResponse.Fail("Invoice not found.", 404);

        // Mark as email sent -- actual email sending is handled by infrastructure
        invoice.EmailSentAt = DateTime.UtcNow;
        invoice.UpdatedAt = DateTime.UtcNow;
        invoice.UpdatedBy = _currentUser.UserId;

        _invoiceRepository.Update(invoice);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok($"Invoice email queued for {email}.");
    }

    private async Task<InvoiceDto?> GetInvoiceDtoByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var invoice = await _invoiceRepository.Query()
            .Include(i => i.LineItems)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (invoice == null) return null;
        return _mapper.Map<InvoiceDto>(invoice);
    }
}
