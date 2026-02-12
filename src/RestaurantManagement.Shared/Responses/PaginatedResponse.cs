using System.Net;

namespace RestaurantManagement.Shared.Responses;

public class PaginatedResponse<T> : ApiResponse<List<T>>
{
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public int TotalCount { get; set; }
    public bool HasPrevious => PageNumber > 1;
    public bool HasNext => PageNumber < TotalPages;

    public static PaginatedResponse<T> Ok(
        List<T> data,
        int totalCount,
        int pageNumber,
        int pageSize,
        string message = "Request completed successfully.")
    {
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PaginatedResponse<T>
        {
            Success = true,
            Message = message,
            Data = data,
            StatusCode = (int)HttpStatusCode.OK,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages
        };
    }
}
