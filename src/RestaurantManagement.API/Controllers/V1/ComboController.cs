using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.Menu;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/combos")]
[Authorize]
public class ComboController : ControllerBase
{
    private readonly IComboService _comboService;

    public ComboController(IComboService comboService)
    {
        _comboService = comboService;
    }

    [HttpGet]
    [Authorize(Policy = Permissions.MenuView)]
    [ProducesResponseType(typeof(ApiResponse<List<ComboDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCombos(CancellationToken cancellationToken)
    {
        var result = await _comboService.GetCombosAsync(cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = Permissions.MenuView)]
    [ProducesResponseType(typeof(ApiResponse<ComboDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCombo(Guid id, CancellationToken cancellationToken)
    {
        var result = await _comboService.GetComboByIdAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.MenuCreate)]
    [ProducesResponseType(typeof(ApiResponse<ComboDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCombo([FromBody] CreateComboDto dto, CancellationToken cancellationToken)
    {
        var result = await _comboService.CreateAsync(dto, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Permissions.MenuUpdate)]
    [ProducesResponseType(typeof(ApiResponse<ComboDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCombo(Guid id, [FromBody] UpdateComboDto dto, CancellationToken cancellationToken)
    {
        var result = await _comboService.UpdateAsync(id, dto, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Permissions.MenuDelete)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCombo(Guid id, CancellationToken cancellationToken)
    {
        var result = await _comboService.DeleteAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPatch("{id:guid}/toggle")]
    [Authorize(Policy = Permissions.MenuUpdate)]
    [ProducesResponseType(typeof(ApiResponse<ComboDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleAvailability(Guid id, CancellationToken cancellationToken)
    {
        var result = await _comboService.ToggleAvailabilityAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }
}
