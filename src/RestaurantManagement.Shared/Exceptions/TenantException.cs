using System.Net;

namespace RestaurantManagement.Shared.Exceptions;

public class TenantException : AppException
{
    public TenantException(string message = "You do not have access to this tenant's resources.")
        : base(message, (int)HttpStatusCode.Forbidden)
    {
    }
}
