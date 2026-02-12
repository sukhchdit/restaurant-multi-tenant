using System.Net;

namespace RestaurantManagement.Shared.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException(string entityName, object key)
        : base($"{entityName} with id '{key}' was not found.", (int)HttpStatusCode.NotFound)
    {
    }

    public NotFoundException(string message)
        : base(message, (int)HttpStatusCode.NotFound)
    {
    }
}
