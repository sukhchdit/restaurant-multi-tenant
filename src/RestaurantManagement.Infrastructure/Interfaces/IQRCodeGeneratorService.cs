namespace RestaurantManagement.Infrastructure.Interfaces;

public interface IQRCodeGeneratorService
{
    string GenerateQRCodeUrl(Guid tableId, Guid restaurantId);
}
