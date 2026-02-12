using System.Net;

namespace RestaurantManagement.Shared.Exceptions;

public class ConflictException : AppException
{
    public ConflictException(string message)
        : base(message, (int)HttpStatusCode.Conflict)
    {
    }
}
