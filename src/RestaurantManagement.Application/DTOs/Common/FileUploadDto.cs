using Microsoft.AspNetCore.Http;

namespace RestaurantManagement.Application.DTOs.Common;

public class FileUploadDto
{
    public IFormFile File { get; set; } = null!;
    public int MaxSizeMB { get; set; } = 5;
    public string[] AllowedExtensions { get; set; } = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
}
