using RestaurantManagement.Application.DTOs.Auth;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<LoginResponseDto>> RegisterAsync(RegisterRequestDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<LoginResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> LogoutAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<ApiResponse<UserDto>> GetCurrentUserAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse> ChangePasswordAsync(ChangePasswordDto dto, CancellationToken cancellationToken = default);
}
