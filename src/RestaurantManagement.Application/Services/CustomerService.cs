using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.DTOs.Customer;
using RestaurantManagement.Application.DTOs.Order;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class CustomerService : ICustomerService
{
    private readonly IRepository<Customer> _customerRepository;
    private readonly IRepository<Domain.Entities.Order> _orderRepository;
    private readonly IRepository<Feedback> _feedbackRepository;
    private readonly IRepository<LoyaltyPoint> _loyaltyPointRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public CustomerService(
        IRepository<Customer> customerRepository,
        IRepository<Domain.Entities.Order> orderRepository,
        IRepository<Feedback> feedbackRepository,
        IRepository<LoyaltyPoint> loyaltyPointRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _customerRepository = customerRepository;
        _orderRepository = orderRepository;
        _feedbackRepository = feedbackRepository;
        _loyaltyPointRepository = loyaltyPointRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PaginatedResultDto<CustomerDto>>> GetCustomersAsync(
        int pageNumber = 1, int pageSize = 20, string? search = null,
        CancellationToken cancellationToken = default)
    {
        var tenantId = _currentUser.TenantId;
        if (tenantId == null)
            return ApiResponse<PaginatedResultDto<CustomerDto>>.Fail("Tenant context not found.", 403);

        var query = _customerRepository.QueryNoTracking()
            .Where(c => c.TenantId == tenantId.Value && !c.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(c => c.FullName.ToLower().Contains(searchLower)
                                     || (c.Email != null && c.Email.ToLower().Contains(searchLower))
                                     || (c.Phone != null && c.Phone.Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var customers = await query
            .OrderBy(c => c.FullName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = _mapper.Map<List<CustomerDto>>(customers);
        var result = new PaginatedResultDto<CustomerDto>(dtos, totalCount, pageNumber, pageSize);

        return ApiResponse<PaginatedResultDto<CustomerDto>>.Ok(result);
    }

    public async Task<ApiResponse<CustomerDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var customer = await _customerRepository.GetByIdAsync(id, cancellationToken);
        if (customer == null || customer.IsDeleted)
            return ApiResponse<CustomerDto>.Fail("Customer not found.", 404);

        var result = _mapper.Map<CustomerDto>(customer);
        return ApiResponse<CustomerDto>.Ok(result);
    }

    public async Task<ApiResponse<CustomerDto>> CreateAsync(CreateCustomerDto dto, CancellationToken cancellationToken = default)
    {
        var customer = new Customer
        {
            TenantId = _currentUser.TenantId ?? Guid.Empty,
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            DateOfBirth = dto.DateOfBirth,
            Anniversary = dto.Anniversary,
            Notes = dto.Notes,
            LoyaltyPoints = 0,
            TotalOrders = 0,
            TotalSpent = 0,
            CreatedBy = _currentUser.UserId
        };

        await _customerRepository.AddAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<CustomerDto>(customer);
        return ApiResponse<CustomerDto>.Ok(result, "Customer created successfully.");
    }

    public async Task<ApiResponse<CustomerDto>> UpdateAsync(Guid id, CreateCustomerDto dto, CancellationToken cancellationToken = default)
    {
        var customer = await _customerRepository.GetByIdAsync(id, cancellationToken);
        if (customer == null || customer.IsDeleted)
            return ApiResponse<CustomerDto>.Fail("Customer not found.", 404);

        customer.FullName = dto.FullName;
        customer.Email = dto.Email;
        customer.Phone = dto.Phone;
        customer.DateOfBirth = dto.DateOfBirth;
        customer.Anniversary = dto.Anniversary;
        customer.Notes = dto.Notes;
        customer.UpdatedAt = DateTime.UtcNow;
        customer.UpdatedBy = _currentUser.UserId;

        _customerRepository.Update(customer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<CustomerDto>(customer);
        return ApiResponse<CustomerDto>.Ok(result, "Customer updated successfully.");
    }

    public async Task<ApiResponse<List<OrderDto>>> GetOrderHistoryAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var orders = await _orderRepository.QueryNoTracking()
            .Where(o => o.CustomerId == customerId && !o.IsDeleted)
            .Include(o => o.OrderItems)
            .Include(o => o.Table)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = _mapper.Map<List<OrderDto>>(orders);
        return ApiResponse<List<OrderDto>>.Ok(result);
    }

    public async Task<ApiResponse<int>> GetLoyaltyPointsAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var customer = await _customerRepository.GetByIdAsync(customerId, cancellationToken);
        if (customer == null || customer.IsDeleted)
            return ApiResponse<int>.Fail("Customer not found.", 404);

        return ApiResponse<int>.Ok(customer.LoyaltyPoints);
    }

    public async Task<ApiResponse<FeedbackDto>> SubmitFeedbackAsync(Guid customerId, CreateFeedbackDto dto, CancellationToken cancellationToken = default)
    {
        var customer = await _customerRepository.GetByIdAsync(customerId, cancellationToken);
        if (customer == null || customer.IsDeleted)
            return ApiResponse<FeedbackDto>.Fail("Customer not found.", 404);

        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<FeedbackDto>.Fail("Restaurant context not found.", 403);

        var feedback = new Feedback
        {
            CustomerId = customerId,
            OrderId = dto.OrderId,
            RestaurantId = restaurantId.Value,
            TenantId = _currentUser.TenantId ?? Guid.Empty,
            Rating = dto.Rating,
            FoodRating = dto.FoodRating,
            ServiceRating = dto.ServiceRating,
            AmbienceRating = dto.AmbienceRating,
            Comment = dto.Comment,
            CreatedBy = _currentUser.UserId
        };

        await _feedbackRepository.AddAsync(feedback, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<FeedbackDto>(feedback);
        result.CustomerName = customer.FullName;

        return ApiResponse<FeedbackDto>.Ok(result, "Feedback submitted successfully.");
    }
}
