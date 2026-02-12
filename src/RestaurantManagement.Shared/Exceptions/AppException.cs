using System.Net;

namespace RestaurantManagement.Shared.Exceptions;

public class AppException : Exception
{
    public int StatusCode { get; }
    public string? Details { get; }

    public AppException(string message, int statusCode = (int)HttpStatusCode.InternalServerError, string? details = null)
        : base(message)
    {
        StatusCode = statusCode;
        Details = details;
    }
}
