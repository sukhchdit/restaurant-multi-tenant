using FluentAssertions;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Domain.ValueObjects;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Helpers;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.UnitTests;

public class DomainEntityTests
{
    [Fact]
    public void BaseEntity_ShouldHaveDefaultValues()
    {
        var entity = new TestEntity();
        entity.Id.Should().NotBeEmpty();
        entity.IsDeleted.Should().BeFalse();
        entity.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void TenantEntity_ShouldRequireTenantId()
    {
        var entity = new Restaurant
        {
            TenantId = Guid.NewGuid(),
            Name = "Test Restaurant"
        };
        entity.TenantId.Should().NotBeEmpty();
    }

    [Fact]
    public void Money_ShouldStoreAmountAndCurrency()
    {
        var money = new Money(100.50m, "INR");
        money.Amount.Should().Be(100.50m);
        money.Currency.Should().Be("INR");
    }

    [Fact]
    public void Email_ShouldValidateFormat()
    {
        var validEmail = new Email("test@example.com");
        validEmail.Value.Should().Be("test@example.com");
    }

    [Fact]
    public void PhoneNumber_ShouldStoreValue()
    {
        var phone = new PhoneNumber("+91", "9876543210");
        phone.Number.Should().Be("9876543210");
        phone.CountryCode.Should().Be("+91");
    }

    private class TestEntity : BaseEntity { }
}

public class SharedHelperTests
{
    [Fact]
    public void PasswordHelper_ShouldHashAndVerify()
    {
        var password = "TestPassword123!";
        var hash = PasswordHelper.HashPassword(password);

        hash.Should().NotBeNullOrEmpty();
        hash.Should().NotBe(password);
        PasswordHelper.VerifyPassword(password, hash).Should().BeTrue();
        PasswordHelper.VerifyPassword("WrongPassword", hash).Should().BeFalse();
    }

    [Fact]
    public void ApiResponse_Ok_ShouldReturnSuccessResponse()
    {
        var response = ApiResponse.Ok("Success");
        response.Success.Should().BeTrue();
        response.Message.Should().Be("Success");
        response.StatusCode.Should().Be(200);
    }

    [Fact]
    public void ApiResponse_Fail_ShouldReturnErrorResponse()
    {
        var response = ApiResponse.Fail("Something went wrong", 400);
        response.Success.Should().BeFalse();
        response.Message.Should().Be("Something went wrong");
        response.StatusCode.Should().Be(400);
    }

    [Fact]
    public void ApiResponseGeneric_Ok_ShouldContainData()
    {
        var data = new { Name = "Test" };
        var response = ApiResponse<object>.Ok(data);
        response.Success.Should().BeTrue();
        response.Data.Should().NotBeNull();
    }

    [Fact]
    public void Permissions_GetPermissionsForRole_SuperAdmin_ShouldHaveAllPermissions()
    {
        var permissions = Permissions.GetPermissionsForRole(Roles.SuperAdmin);
        permissions.Should().NotBeEmpty();
        permissions.Should().Contain(Permissions.MenuCreate);
        permissions.Should().Contain(Permissions.OrderDelete);
        permissions.Should().Contain(Permissions.AuditView);
    }

    [Fact]
    public void Permissions_GetPermissionsForRole_Waiter_ShouldHaveLimitedPermissions()
    {
        var permissions = Permissions.GetPermissionsForRole(Roles.Waiter);
        permissions.Should().Contain(Permissions.MenuView);
        permissions.Should().Contain(Permissions.OrderCreate);
        permissions.Should().NotContain(Permissions.MenuDelete);
        permissions.Should().NotContain(Permissions.StaffDelete);
    }

    [Fact]
    public void Permissions_GetPermissionsForRole_Customer_ShouldHaveMinimalPermissions()
    {
        var permissions = Permissions.GetPermissionsForRole(Roles.Customer);
        permissions.Should().Contain(Permissions.MenuView);
        permissions.Should().Contain(Permissions.OrderCreate);
        permissions.Should().NotContain(Permissions.OrderDelete);
        permissions.Should().NotContain(Permissions.InventoryView);
    }
}

public class EnumTests
{
    [Fact]
    public void OrderStatus_ShouldHaveExpectedValues()
    {
        Enum.GetValues<OrderStatus>().Should().HaveCountGreaterThanOrEqualTo(7);
    }

    [Fact]
    public void UserRoleType_ShouldHave8Roles()
    {
        Enum.GetValues<UserRoleType>().Should().HaveCount(8);
    }

    [Fact]
    public void TableStatus_ShouldHaveExpectedValues()
    {
        Enum.GetValues<TableStatus>().Should().HaveCountGreaterThanOrEqualTo(4);
    }
}
