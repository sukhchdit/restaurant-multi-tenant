namespace RestaurantManagement.Domain.Enums;

public enum AuditAction
{
    Create = 0,
    Update = 1,
    Delete = 2,
    Login = 3,
    Logout = 4,
    StatusChange = 5,
    PasswordChange = 6,
    RoleChange = 7,
    PaymentAction = 8,
    RefundAction = 9,
    SettingsChange = 10
}
