using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _storagePath;
    private readonly string _baseUrl;
    private readonly ILogger<FileStorageService> _logger;

    public FileStorageService(IConfiguration configuration, ILogger<FileStorageService> logger)
    {
        _logger = logger;
        _storagePath = configuration["FileStorage:LocalPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        _baseUrl = configuration["FileStorage:BaseUrl"] ?? "/uploads";

        // Ensure the storage directory exists
        if (!Directory.Exists(_storagePath))
        {
            Directory.CreateDirectory(_storagePath);
        }
    }

    public async Task<string> UploadFileAsync(
        IFormFile file,
        string folder,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Generate a unique file name to prevent collisions
            var extension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid():N}{extension}";

            // Organize files by folder and date
            var datePath = DateTime.UtcNow.ToString("yyyy/MM/dd");
            var directoryPath = Path.Combine(_storagePath, folder, datePath);

            if (!Directory.Exists(directoryPath))
            {
                Directory.CreateDirectory(directoryPath);
            }

            var filePath = Path.Combine(directoryPath, uniqueFileName);

            await using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write);
            await file.CopyToAsync(fileStream, cancellationToken);

            var fileUrl = $"{_baseUrl}/{folder}/{datePath}/{uniqueFileName}";

            _logger.LogInformation("File uploaded successfully: {FileName} -> {FileUrl}", file.FileName, fileUrl);

            return fileUrl;

            // TODO: Integrate with AWS S3 for production
            // var s3Client = new AmazonS3Client(RegionEndpoint.APSouth1);
            // var putRequest = new PutObjectRequest
            // {
            //     BucketName = configuration["AWS:S3:BucketName"],
            //     Key = $"{folder}/{datePath}/{uniqueFileName}",
            //     InputStream = file.OpenReadStream(),
            //     ContentType = file.ContentType,
            //     CannedACL = S3CannedACL.PublicRead
            // };
            // var response = await s3Client.PutObjectAsync(putRequest, cancellationToken);
            // return $"https://{putRequest.BucketName}.s3.amazonaws.com/{putRequest.Key}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file: {FileName}", file.FileName);
            throw;
        }
    }

    public Task DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        try
        {
            // Convert URL back to file path
            var relativePath = fileUrl.Replace(_baseUrl, string.Empty).TrimStart('/');
            var filePath = Path.Combine(_storagePath, relativePath.Replace('/', Path.DirectorySeparatorChar));

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                _logger.LogInformation("File deleted successfully: {FileUrl}", fileUrl);
            }
            else
            {
                _logger.LogWarning("File not found for deletion: {FileUrl}", fileUrl);
            }

            return Task.CompletedTask;

            // TODO: Integrate with AWS S3 for production
            // var s3Client = new AmazonS3Client(RegionEndpoint.APSouth1);
            // var deleteRequest = new DeleteObjectRequest
            // {
            //     BucketName = configuration["AWS:S3:BucketName"],
            //     Key = relativePath
            // };
            // await s3Client.DeleteObjectAsync(deleteRequest, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file: {FileUrl}", fileUrl);
            throw;
        }
    }
}
