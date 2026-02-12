using System.Net;

namespace RestaurantManagement.Shared.Exceptions;

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "You are not authorized to perform this action.")
        : base(message, (int)HttpStatusCode.Unauthorized)
    {
    }
}
