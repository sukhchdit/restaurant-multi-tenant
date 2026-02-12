using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using RestaurantManagement.Application.DTOs.Auth;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Helpers;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class AuthService : IAuthService
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<RefreshToken> _refreshTokenRepository;
    private readonly IRepository<UserRole> _userRoleRepository;
    private readonly IRepository<Role> _roleRepository;
    private readonly IRepository<Restaurant> _restaurantRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;

    public AuthService(
        IRepository<User> userRepository,
        IRepository<RefreshToken> refreshTokenRepository,
        IRepository<UserRole> userRoleRepository,
        IRepository<Role> roleRepository,
        IRepository<Restaurant> restaurantRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IMapper mapper,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _userRoleRepository = userRoleRepository;
        _roleRepository = roleRepository;
        _restaurantRepository = restaurantRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
        _configuration = configuration;
    }

    public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.FirstOrDefaultAsync(u => u.Email == dto.Email && !u.IsDeleted, cancellationToken);
        if (user == null)
            return ApiResponse<LoginResponseDto>.Fail("Invalid email or password.", 401);

        if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
            return ApiResponse<LoginResponseDto>.Fail("Account is locked. Please try again later.", 423);

        if (!user.IsActive)
            return ApiResponse<LoginResponseDto>.Fail("Account is deactivated. Contact your administrator.", 403);

        if (!PasswordHelper.VerifyPassword(dto.Password, user.PasswordHash))
        {
            user.FailedLoginCount++;
            if (user.FailedLoginCount >= 5)
            {
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);
            }
            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<LoginResponseDto>.Fail("Invalid email or password.", 401);
        }

        user.FailedLoginCount = 0;
        user.LockoutEnd = null;
        user.LastLoginAt = DateTime.UtcNow;
        _userRepository.Update(user);

        var userRole = await _userRoleRepository.Query()
            .Include(ur => ur.Role)
            .Include(ur => ur.Restaurant)
            .FirstOrDefaultAsync(ur => ur.UserId == user.Id && !ur.IsDeleted, cancellationToken);

        var roleName = userRole?.Role?.Name ?? "User";
        var restaurantId = userRole?.RestaurantId;
        var restaurantName = userRole?.Restaurant?.Name;

        var response = await GenerateTokensAsync(user, roleName, restaurantId, restaurantName, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<LoginResponseDto>.Ok(response, "Login successful.");
    }

    public async Task<ApiResponse<LoginResponseDto>> RegisterAsync(RegisterRequestDto dto, CancellationToken cancellationToken = default)
    {
        var existingUser = await _userRepository.AnyAsync(u => u.Email == dto.Email && !u.IsDeleted, cancellationToken);
        if (existingUser)
            return ApiResponse<LoginResponseDto>.Fail("An account with this email already exists.");

        var role = await _roleRepository.FirstOrDefaultAsync(r => r.Name == dto.Role, cancellationToken);
        if (role == null)
            return ApiResponse<LoginResponseDto>.Fail($"Role '{dto.Role}' not found.");

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var user = new User
            {
                Email = dto.Email,
                PasswordHash = PasswordHelper.HashPassword(dto.Password),
                FullName = dto.FullName,
                Phone = dto.Phone,
                IsActive = true,
                EmailVerified = false,
                TenantId = _currentUser.TenantId ?? Guid.Empty
            };

            await _userRepository.AddAsync(user, cancellationToken);

            var userRole = new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id,
                TenantId = user.TenantId
            };

            await _userRoleRepository.AddAsync(userRole, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var response = await GenerateTokensAsync(user, role.Name, null, null, cancellationToken);

            await _unitOfWork.CommitAsync(cancellationToken);

            return ApiResponse<LoginResponseDto>.Ok(response, "Registration successful.");
        }
        catch
        {
            await _unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<ApiResponse<LoginResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto dto, CancellationToken cancellationToken = default)
    {
        var storedToken = await _refreshTokenRepository.FirstOrDefaultAsync(
            rt => rt.Token == dto.RefreshToken && !rt.IsDeleted, cancellationToken);

        if (storedToken == null || !storedToken.IsActive)
            return ApiResponse<LoginResponseDto>.Fail("Invalid or expired refresh token.", 401);

        var user = await _userRepository.GetByIdAsync(storedToken.UserId, cancellationToken);
        if (user == null || !user.IsActive || user.IsDeleted)
            return ApiResponse<LoginResponseDto>.Fail("User not found or deactivated.", 401);

        storedToken.RevokedAt = DateTime.UtcNow;
        _refreshTokenRepository.Update(storedToken);

        var userRole = await _userRoleRepository.Query()
            .Include(ur => ur.Role)
            .Include(ur => ur.Restaurant)
            .FirstOrDefaultAsync(ur => ur.UserId == user.Id && !ur.IsDeleted, cancellationToken);

        var roleName = userRole?.Role?.Name ?? "User";
        var restaurantId = userRole?.RestaurantId;
        var restaurantName = userRole?.Restaurant?.Name;

        var response = await GenerateTokensAsync(user, roleName, restaurantId, restaurantName, cancellationToken);

        storedToken.ReplacedByToken = response.RefreshToken;
        _refreshTokenRepository.Update(storedToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<LoginResponseDto>.Ok(response, "Token refreshed successfully.");
    }

    public async Task<ApiResponse> LogoutAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var storedToken = await _refreshTokenRepository.FirstOrDefaultAsync(
            rt => rt.Token == refreshToken && !rt.IsDeleted, cancellationToken);

        if (storedToken != null && storedToken.IsActive)
        {
            storedToken.RevokedAt = DateTime.UtcNow;
            _refreshTokenRepository.Update(storedToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return ApiResponse.Ok("Logged out successfully.");
    }

    public async Task<ApiResponse<UserDto>> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        if (_currentUser.UserId == null)
            return ApiResponse<UserDto>.Fail("User not authenticated.", 401);

        var user = await _userRepository.GetByIdAsync(_currentUser.UserId.Value, cancellationToken);
        if (user == null || user.IsDeleted)
            return ApiResponse<UserDto>.Fail("User not found.", 404);

        var userRole = await _userRoleRepository.Query()
            .Include(ur => ur.Role)
            .Include(ur => ur.Restaurant)
            .FirstOrDefaultAsync(ur => ur.UserId == user.Id && !ur.IsDeleted, cancellationToken);

        var userDto = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            AvatarUrl = user.AvatarUrl,
            Role = userRole?.Role?.Name ?? "User",
            TenantId = user.TenantId,
            RestaurantId = userRole?.RestaurantId,
            RestaurantName = userRole?.Restaurant?.Name
        };

        return ApiResponse<UserDto>.Ok(userDto);
    }

    public async Task<ApiResponse> ChangePasswordAsync(ChangePasswordDto dto, CancellationToken cancellationToken = default)
    {
        if (_currentUser.UserId == null)
            return ApiResponse.Fail("User not authenticated.", 401);

        if (dto.NewPassword != dto.ConfirmPassword)
            return ApiResponse.Fail("New password and confirm password do not match.");

        var user = await _userRepository.GetByIdAsync(_currentUser.UserId.Value, cancellationToken);
        if (user == null || user.IsDeleted)
            return ApiResponse.Fail("User not found.", 404);

        if (!PasswordHelper.VerifyPassword(dto.CurrentPassword, user.PasswordHash))
            return ApiResponse.Fail("Current password is incorrect.");

        user.PasswordHash = PasswordHelper.HashPassword(dto.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = _currentUser.UserId;
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok("Password changed successfully.");
    }

    private async Task<LoginResponseDto> GenerateTokensAsync(
        User user, string role, Guid? restaurantId, string? restaurantName,
        CancellationToken cancellationToken)
    {
        var secretKey = _configuration["JWT:Secret"] ?? throw new InvalidOperationException("JWT:Secret is not configured");
        var issuer = _configuration["JWT:Issuer"] ?? "RestaurantManagement";
        var audience = _configuration["JWT:Audience"] ?? "RestaurantManagementApp";
        var expiryMinutes = int.TryParse(_configuration["JWT:AccessTokenExpiryMinutes"], out var exp) ? exp : 60;
        var refreshTokenDays = int.TryParse(_configuration["JWT:RefreshTokenExpiryDays"], out var rtd) ? rtd : 7;

        var permissions = Permissions.GetPermissionsForRole(role);

        var accessToken = JwtHelper.GenerateAccessToken(
            user.Id, user.Email, role, user.TenantId, restaurantId,
            secretKey, issuer, audience, expiryMinutes, permissions);

        var refreshTokenValue = JwtHelper.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(refreshTokenDays)
        };

        await _refreshTokenRepository.AddAsync(refreshToken, cancellationToken);

        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Phone = user.Phone,
                AvatarUrl = user.AvatarUrl,
                Role = role,
                TenantId = user.TenantId,
                RestaurantId = restaurantId,
                RestaurantName = restaurantName
            }
        };
    }
}
