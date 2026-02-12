using System.Text.Json;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.Infrastructure.Services;

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly IDatabase? _database;
    private readonly ILogger<RedisCacheService> _logger;
    private readonly bool _isConnected;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public RedisCacheService(
        IConnectionMultiplexer? redis,
        ILogger<RedisCacheService> logger)
    {
        _logger = logger;

        try
        {
            _redis = redis;
            _database = redis?.GetDatabase();
            _isConnected = redis?.IsConnected ?? false;

            if (_isConnected)
            {
                _logger.LogInformation("Redis cache service connected successfully");
            }
            else
            {
                _logger.LogWarning("Redis is not connected. Cache operations will be skipped");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to connect to Redis. Cache operations will be skipped");
            _isConnected = false;
        }
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        if (!_isConnected || _database == null)
        {
            _logger.LogDebug("Redis not available. Cache GET skipped for key: {Key}", key);
            return default;
        }

        try
        {
            var value = await _database.StringGetAsync(key);

            if (value.IsNullOrEmpty)
            {
                return default;
            }

            return JsonSerializer.Deserialize<T>((string)value!, JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error retrieving cache key: {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(
        string key,
        T value,
        TimeSpan? expiry = null,
        CancellationToken cancellationToken = default)
    {
        if (!_isConnected || _database == null)
        {
            _logger.LogDebug("Redis not available. Cache SET skipped for key: {Key}", key);
            return;
        }

        try
        {
            var serializedValue = JsonSerializer.Serialize(value, JsonOptions);
            var defaultExpiry = expiry ?? TimeSpan.FromMinutes(30);

            await _database.StringSetAsync(key, serializedValue, defaultExpiry);

            _logger.LogDebug("Cache SET successful for key: {Key}, Expiry: {Expiry}", key, defaultExpiry);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error setting cache key: {Key}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        if (!_isConnected || _database == null)
        {
            _logger.LogDebug("Redis not available. Cache REMOVE skipped for key: {Key}", key);
            return;
        }

        try
        {
            await _database.KeyDeleteAsync(key);
            _logger.LogDebug("Cache REMOVE successful for key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error removing cache key: {Key}", key);
        }
    }
}
