using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.Customer;
using RestaurantManagement.Application.DTOs.Order;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/customers")]
[Authorize]
public class CustomerController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomerController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    [Authorize(Policy = Permissions.CustomerView)]
    [ProducesResponseType(typeof(ApiResponse<List<CustomerDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _customerService.GetCustomersAsync(pageNumber, pageSize, search, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = Permissions.CustomerView)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCustomerById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _customerService.GetByIdAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.CustomerCreate)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerDto dto, CancellationToken cancellationToken)
    {
        var result = await _customerService.CreateAsync(dto, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Permissions.CustomerUpdate)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCustomer(Guid id, [FromBody] CreateCustomerDto dto, CancellationToken cancellationToken)
    {
        var result = await _customerService.UpdateAsync(id, dto, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("{customerId:guid}/orders")]
    [Authorize(Policy = Permissions.CustomerView)]
    [ProducesResponseType(typeof(ApiResponse<List<OrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCustomerOrders(Guid customerId, CancellationToken cancellationToken)
    {
        var result = await _customerService.GetOrderHistoryAsync(customerId, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("{customerId:guid}/loyalty-points")]
    [Authorize(Policy = Permissions.CustomerView)]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLoyaltyPoints(Guid customerId, CancellationToken cancellationToken)
    {
        var result = await _customerService.GetLoyaltyPointsAsync(customerId, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("feedback")]
    [Authorize(Policy = Permissions.CustomerView)]
    [ProducesResponseType(typeof(ApiResponse<List<FeedbackDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllFeedback(
        [FromQuery] Guid? customerId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _customerService.GetAllFeedbackAsync(customerId, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("{customerId:guid}/feedback")]
    [Authorize(Policy = Permissions.CustomerCreate)]
    [ProducesResponseType(typeof(ApiResponse<FeedbackDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitFeedback(Guid customerId, [FromBody] CreateFeedbackDto dto, CancellationToken cancellationToken)
    {
        var result = await _customerService.SubmitFeedbackAsync(customerId, dto, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }
}
