using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.Menu;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class MenuController : ControllerBase
{
    private readonly IMenuService _menuService;

    public MenuController(IMenuService menuService)
    {
        _menuService = menuService;
    }

    [HttpGet("categories")]
    [Authorize(Policy = Permissions.MenuView)]
    [ProducesResponseType(typeof(ApiResponse<List<CategoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
    {
        var result = await _menuService.GetCategoriesAsync(cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("categories")]
    [Authorize(Policy = Permissions.MenuCreate)]
    [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCategory([FromBody] CategoryDto dto, CancellationToken cancellationToken)
    {
        var result = await _menuService.CreateCategoryAsync(dto, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("items")]
    [Authorize(Policy = Permissions.MenuView)]
    [ProducesResponseType(typeof(ApiResponse<List<MenuItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetItems(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] bool? isVeg = null,
        [FromQuery] bool? isAvailable = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _menuService.GetItemsAsync(pageNumber, pageSize, search, categoryId, isVeg, isAvailable, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("items/{id:guid}")]
    [Authorize(Policy = Permissions.MenuView)]
    [ProducesResponseType(typeof(ApiResponse<MenuItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetItemById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _menuService.GetItemByIdAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("items")]
    [Authorize(Policy = Permissions.MenuCreate)]
    [ProducesResponseType(typeof(ApiResponse<MenuItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateItem([FromBody] CreateMenuItemDto dto, CancellationToken cancellationToken)
    {
        var result = await _menuService.CreateItemAsync(dto, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPut("items/{id:guid}")]
    [Authorize(Policy = Permissions.MenuUpdate)]
    [ProducesResponseType(typeof(ApiResponse<MenuItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateItem(Guid id, [FromBody] UpdateMenuItemDto dto, CancellationToken cancellationToken)
    {
        var result = await _menuService.UpdateItemAsync(id, dto, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpDelete("items/{id:guid}")]
    [Authorize(Policy = Permissions.MenuDelete)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteItem(Guid id, CancellationToken cancellationToken)
    {
        var result = await _menuService.DeleteItemAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPatch("items/{id:guid}/toggle-availability")]
    [Authorize(Policy = Permissions.MenuUpdate)]
    [ProducesResponseType(typeof(ApiResponse<MenuItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleAvailability(Guid id, CancellationToken cancellationToken)
    {
        var result = await _menuService.ToggleAvailabilityAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [AllowAnonymous]
    [HttpGet("public/{restaurantId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<List<CategoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPublicMenu(Guid restaurantId, CancellationToken cancellationToken)
    {
        var result = await _menuService.GetPublicMenuAsync(restaurantId, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }
}
