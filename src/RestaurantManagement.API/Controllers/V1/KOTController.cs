using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.KOT;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class KOTController : ControllerBase
{
    private readonly IKOTService _kotService;

    public KOTController(IKOTService kotService)
    {
        _kotService = kotService;
    }

    [HttpGet]
    [Authorize(Policy = Permissions.KotView)]
    [ProducesResponseType(typeof(ApiResponse<List<KOTDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveKOTs(CancellationToken cancellationToken)
    {
        var result = await _kotService.GetActiveKOTsAsync(cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPatch("{id:guid}/acknowledge")]
    [Authorize(Policy = Permissions.KotUpdate)]
    [ProducesResponseType(typeof(ApiResponse<KOTDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Acknowledge(Guid id, CancellationToken cancellationToken)
    {
        var result = await _kotService.AcknowledgeAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPatch("{id:guid}/start-preparing")]
    [Authorize(Policy = Permissions.KotUpdate)]
    [ProducesResponseType(typeof(ApiResponse<KOTDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StartPreparing(Guid id, CancellationToken cancellationToken)
    {
        var result = await _kotService.StartPreparingAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPatch("{id:guid}/mark-ready")]
    [Authorize(Policy = Permissions.KotUpdate)]
    [ProducesResponseType(typeof(ApiResponse<KOTDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkReady(Guid id, CancellationToken cancellationToken)
    {
        var result = await _kotService.MarkReadyAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }
}
