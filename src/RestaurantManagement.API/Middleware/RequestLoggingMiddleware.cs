using System.Diagnostics;

namespace RestaurantManagement.API.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestPath = context.Request.Path;
        var method = context.Request.Method;

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var statusCode = context.Response.StatusCode;
            var elapsed = stopwatch.ElapsedMilliseconds;

            if (elapsed > 500)
            {
                _logger.LogWarning("Slow request: {Method} {Path} responded {StatusCode} in {ElapsedMs}ms",
                    method, requestPath, statusCode, elapsed);
            }
            else
            {
                _logger.LogInformation("{Method} {Path} responded {StatusCode} in {ElapsedMs}ms",
                    method, requestPath, statusCode, elapsed);
            }
        }
    }
}
