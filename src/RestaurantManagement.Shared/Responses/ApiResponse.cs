using System.Net;
using System.Text.Json.Serialization;

namespace RestaurantManagement.Shared.Responses;

public class ApiResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string>? Errors { get; set; }
    public int StatusCode { get; set; }

    public static ApiResponse Ok(string message = "Request completed successfully.")
    {
        return new ApiResponse
        {
            Success = true,
            Message = message,
            StatusCode = (int)HttpStatusCode.OK
        };
    }

    public static ApiResponse Fail(string message, int statusCode = (int)HttpStatusCode.BadRequest)
    {
        return new ApiResponse
        {
            Success = false,
            Message = message,
            StatusCode = statusCode
        };
    }

    public static ApiResponse Fail(List<string> errors, int statusCode = (int)HttpStatusCode.BadRequest)
    {
        return new ApiResponse
        {
            Success = false,
            Message = "One or more errors occurred.",
            Errors = errors,
            StatusCode = statusCode
        };
    }
}

public class ApiResponse<T> : ApiResponse
{
    public T? Data { get; set; }

    public static ApiResponse<T> Ok(T data, string message = "Request completed successfully.")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data,
            StatusCode = (int)HttpStatusCode.OK
        };
    }

    public new static ApiResponse<T> Fail(string message, int statusCode = (int)HttpStatusCode.BadRequest)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            StatusCode = statusCode
        };
    }

    public new static ApiResponse<T> Fail(List<string> errors, int statusCode = (int)HttpStatusCode.BadRequest)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = "One or more errors occurred.",
            Errors = errors,
            StatusCode = statusCode
        };
    }
}
