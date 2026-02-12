using AutoMapper;
using RestaurantManagement.Application.DTOs.Auth;
using RestaurantManagement.Application.DTOs.Billing;
using RestaurantManagement.Application.DTOs.Customer;
using RestaurantManagement.Application.DTOs.Discount;
using RestaurantManagement.Application.DTOs.Inventory;
using RestaurantManagement.Application.DTOs.KOT;
using RestaurantManagement.Application.DTOs.Menu;
using RestaurantManagement.Application.DTOs.Notification;
using RestaurantManagement.Application.DTOs.Order;
using RestaurantManagement.Application.DTOs.Payment;
using RestaurantManagement.Application.DTOs.Staff;
using RestaurantManagement.Application.DTOs.Table;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Application.Mappings;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        // ===== Auth =====
        CreateMap<User, UserDto>()
            .ForMember(d => d.Role, opt => opt.Ignore())
            .ForMember(d => d.RestaurantId, opt => opt.Ignore())
            .ForMember(d => d.RestaurantName, opt => opt.Ignore());

        // ===== Menu =====
        CreateMap<Category, CategoryDto>()
            .ForMember(d => d.SubCategories, opt => opt.MapFrom(s => s.SubCategories));

        CreateMap<MenuItem, MenuItemDto>()
            .ForMember(d => d.CategoryName, opt => opt.MapFrom(s => s.Category != null ? s.Category.Name : string.Empty))
            .ForMember(d => d.Tags, opt => opt.MapFrom(s =>
                !string.IsNullOrWhiteSpace(s.Tags)
                    ? s.Tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
                    : new List<string>()));

        CreateMap<CreateMenuItemDto, MenuItem>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.RestaurantId, opt => opt.Ignore())
            .ForMember(d => d.TenantId, opt => opt.Ignore())
            .ForMember(d => d.IsAvailable, opt => opt.Ignore())
            .ForMember(d => d.ImageUrl, opt => opt.Ignore())
            .ForMember(d => d.CalorieCount, opt => opt.Ignore())
            .ForMember(d => d.SpiceLevel, opt => opt.Ignore())
            .ForMember(d => d.SortOrder, opt => opt.Ignore())
            .ForMember(d => d.DiscountedPrice, opt => opt.Ignore())
            .ForMember(d => d.AvailableFrom, opt => opt.Ignore())
            .ForMember(d => d.AvailableTo, opt => opt.Ignore())
            .ForMember(d => d.AvailableDays, opt => opt.Ignore());

        // ===== Order =====
        CreateMap<Order, OrderDto>()
            .ForMember(d => d.TableNumber, opt => opt.MapFrom(s => s.Table != null ? s.Table.TableNumber : null))
            .ForMember(d => d.WaiterName, opt => opt.MapFrom(s => s.Waiter != null ? s.Waiter.FullName : null))
            .ForMember(d => d.Items, opt => opt.MapFrom(s => s.OrderItems));

        CreateMap<OrderItem, OrderItemDto>();

        // ===== KOT =====
        CreateMap<KitchenOrderTicket, KOTDto>()
            .ForMember(d => d.OrderNumber, opt => opt.MapFrom(s => s.Order != null ? s.Order.OrderNumber : string.Empty))
            .ForMember(d => d.AssignedChefName, opt => opt.MapFrom(s => s.AssignedChef != null ? s.AssignedChef.FullName : null))
            .ForMember(d => d.Priority, opt => opt.MapFrom(s =>
                s.Priority >= 3 ? "urgent" :
                s.Priority == 2 ? "high" :
                s.Priority == 1 ? "medium" : "low"))
            .ForMember(d => d.Items, opt => opt.MapFrom(s => s.KOTItems));

        CreateMap<KOTItem, KOTItemDto>();

        // ===== Table =====
        CreateMap<RestaurantTable, TableDto>();

        CreateMap<TableReservation, TableReservationDto>()
            .ForMember(d => d.TableNumber, opt => opt.MapFrom(s => s.Table != null ? s.Table.TableNumber : string.Empty));

        // ===== Inventory =====
        CreateMap<InventoryItem, InventoryItemDto>()
            .ForMember(d => d.CategoryName, opt => opt.MapFrom(s => s.Category != null ? s.Category.Name : string.Empty))
            .ForMember(d => d.SupplierName, opt => opt.MapFrom(s => s.Supplier != null ? s.Supplier.Name : null));

        CreateMap<StockMovement, StockMovementDto>()
            .ForMember(d => d.InventoryItemName, opt => opt.MapFrom(s => s.InventoryItem != null ? s.InventoryItem.Name : string.Empty));

        // ===== Staff =====
        CreateMap<Domain.Entities.Staff, StaffDto>();

        CreateMap<Attendance, AttendanceDto>()
            .ForMember(d => d.StaffName, opt => opt.MapFrom(s => s.Staff != null ? s.Staff.FullName : string.Empty));

        // ===== Customer =====
        CreateMap<Domain.Entities.Customer, CustomerDto>();

        CreateMap<Feedback, FeedbackDto>()
            .ForMember(d => d.CustomerName, opt => opt.MapFrom(s => s.Customer != null ? s.Customer.FullName : null))
            .ForMember(d => d.OrderNumber, opt => opt.MapFrom(s => s.Order != null ? s.Order.OrderNumber : null));

        // ===== Payment =====
        CreateMap<Payment, PaymentDto>()
            .ForMember(d => d.OrderNumber, opt => opt.MapFrom(s => s.Order != null ? s.Order.OrderNumber : null))
            .ForMember(d => d.Splits, opt => opt.MapFrom(s => s.PaymentSplits));

        CreateMap<PaymentSplit, PaymentSplitDto>();

        // ===== Billing =====
        CreateMap<Invoice, InvoiceDto>()
            .ForMember(d => d.LineItems, opt => opt.MapFrom(s => s.LineItems));

        CreateMap<InvoiceLineItem, InvoiceLineItemDto>();

        // ===== Discount =====
        CreateMap<Domain.Entities.Discount, DiscountDto>();

        CreateMap<Coupon, CouponDto>()
            .ForMember(d => d.DiscountName, opt => opt.MapFrom(s => s.Discount != null ? s.Discount.Name : null));

        // ===== Notification =====
        CreateMap<Domain.Entities.Notification, NotificationDto>();

        // ===== AuditLog =====
        CreateMap<AuditLog, AuditLogDto>();
    }
}
