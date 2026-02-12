using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;

    public SettingsController(ISettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    [HttpGet]
    [Authorize(Policy = Permissions.SettingsView)]
    [ProducesResponseType(typeof(ApiResponse<SettingsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettings(CancellationToken cancellationToken)
    {
        var result = await _settingsService.GetSettingsAsync(cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPut]
    [Authorize(Policy = Permissions.SettingsUpdate)]
    [ProducesResponseType(typeof(ApiResponse<SettingsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsDto dto, CancellationToken cancellationToken)
    {
        var result = await _settingsService.UpdateSettingsAsync(dto, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }
}
