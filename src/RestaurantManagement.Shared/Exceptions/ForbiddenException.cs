using System.Net;

namespace RestaurantManagement.Shared.Exceptions;

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "You do not have permission to access this resource.")
        : base(message, (int)HttpStatusCode.Forbidden)
    {
    }
}
