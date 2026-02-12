using Microsoft.Extensions.Configuration;
using RestaurantManagement.Infrastructure.Interfaces;

namespace RestaurantManagement.Infrastructure.Services;

public class QRCodeGeneratorService : IQRCodeGeneratorService
{
    private readonly string _baseUrl;

    public QRCodeGeneratorService(IConfiguration configuration)
    {
        _baseUrl = configuration["App:BaseUrl"]?.TrimEnd('/')
            ?? "https://localhost:5001";
    }

    /// <summary>
    /// Generates a URL that can be encoded into a QR code for customer table ordering.
    /// The returned URL points to the customer-facing ordering page with the table and restaurant context.
    /// </summary>
    /// <param name="tableId">The unique identifier of the restaurant table.</param>
    /// <param name="restaurantId">The unique identifier of the restaurant.</param>
    /// <returns>A fully qualified URL for the customer ordering page.</returns>
    public string GenerateQRCodeUrl(Guid tableId, Guid restaurantId)
    {
        return $"{_baseUrl}/customer?table={tableId}&restaurant={restaurantId}";
    }
}
