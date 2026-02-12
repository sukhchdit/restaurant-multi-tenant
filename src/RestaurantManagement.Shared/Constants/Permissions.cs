namespace RestaurantManagement.Shared.Constants;

public static class Permissions
{
    // Menu
    public const string MenuView = "menu:view";
    public const string MenuCreate = "menu:create";
    public const string MenuUpdate = "menu:update";
    public const string MenuDelete = "menu:delete";

    // Order
    public const string OrderView = "order:view";
    public const string OrderCreate = "order:create";
    public const string OrderUpdate = "order:update";
    public const string OrderDelete = "order:delete";
    public const string OrderCancel = "order:cancel";

    // KOT
    public const string KotView = "kot:view";
    public const string KotUpdate = "kot:update";

    // Table
    public const string TableView = "table:view";
    public const string TableCreate = "table:create";
    public const string TableUpdate = "table:update";
    public const string TableDelete = "table:delete";

    // Inventory
    public const string InventoryView = "inventory:view";
    public const string InventoryCreate = "inventory:create";
    public const string InventoryUpdate = "inventory:update";
    public const string InventoryDelete = "inventory:delete";

    // Staff
    public const string StaffView = "staff:view";
    public const string StaffCreate = "staff:create";
    public const string StaffUpdate = "staff:update";
    public const string StaffDelete = "staff:delete";

    // Customer
    public const string CustomerView = "customer:view";
    public const string CustomerCreate = "customer:create";
    public const string CustomerUpdate = "customer:update";

    // Payment
    public const string PaymentView = "payment:view";
    public const string PaymentProcess = "payment:process";
    public const string PaymentRefund = "payment:refund";

    // Discount
    public const string DiscountView = "discount:view";
    public const string DiscountCreate = "discount:create";
    public const string DiscountUpdate = "discount:update";
    public const string DiscountDelete = "discount:delete";

    // Billing
    public const string BillingView = "billing:view";
    public const string BillingCreate = "billing:create";
    public const string BillingExport = "billing:export";

    // Report
    public const string ReportView = "report:view";
    public const string ReportExport = "report:export";

    // Settings
    public const string SettingsView = "settings:view";
    public const string SettingsUpdate = "settings:update";

    // Audit Log
    public const string AuditView = "audit:view";

    // Notification
    public const string NotificationView = "notification:view";

    private static readonly IReadOnlyList<string> AllPermissions = new[]
    {
        MenuView, MenuCreate, MenuUpdate, MenuDelete,
        OrderView, OrderCreate, OrderUpdate, OrderDelete, OrderCancel,
        KotView, KotUpdate,
        TableView, TableCreate, TableUpdate, TableDelete,
        InventoryView, InventoryCreate, InventoryUpdate, InventoryDelete,
        StaffView, StaffCreate, StaffUpdate, StaffDelete,
        CustomerView, CustomerCreate, CustomerUpdate,
        PaymentView, PaymentProcess, PaymentRefund,
        DiscountView, DiscountCreate, DiscountUpdate, DiscountDelete,
        BillingView, BillingCreate, BillingExport,
        ReportView, ReportExport,
        SettingsView, SettingsUpdate,
        AuditView,
        NotificationView
    };

    public static IReadOnlyList<string> GetPermissionsForRole(string role)
    {
        return role switch
        {
            Roles.SuperAdmin => AllPermissions,

            Roles.RestaurantAdmin => new[]
            {
                MenuView, MenuCreate, MenuUpdate, MenuDelete,
                OrderView, OrderCreate, OrderUpdate, OrderDelete, OrderCancel,
                KotView, KotUpdate,
                TableView, TableCreate, TableUpdate, TableDelete,
                InventoryView, InventoryCreate, InventoryUpdate, InventoryDelete,
                StaffView, StaffCreate, StaffUpdate, StaffDelete,
                CustomerView, CustomerCreate, CustomerUpdate,
                PaymentView, PaymentProcess, PaymentRefund,
                DiscountView, DiscountCreate, DiscountUpdate, DiscountDelete,
                BillingView, BillingCreate, BillingExport,
                ReportView, ReportExport,
                SettingsView, SettingsUpdate,
                AuditView,
                NotificationView
            },

            Roles.Manager => new[]
            {
                MenuView, MenuCreate, MenuUpdate,
                OrderView, OrderCreate, OrderUpdate, OrderCancel,
                KotView, KotUpdate,
                TableView, TableCreate, TableUpdate,
                InventoryView, InventoryCreate, InventoryUpdate,
                StaffView, StaffCreate, StaffUpdate,
                CustomerView, CustomerCreate, CustomerUpdate,
                PaymentView, PaymentProcess, PaymentRefund,
                DiscountView, DiscountCreate, DiscountUpdate,
                BillingView, BillingCreate, BillingExport,
                ReportView, ReportExport,
                SettingsView,
                AuditView,
                NotificationView
            },

            Roles.Cashier => new[]
            {
                MenuView,
                OrderView, OrderCreate, OrderUpdate,
                KotView,
                TableView,
                CustomerView, CustomerCreate, CustomerUpdate,
                PaymentView, PaymentProcess, PaymentRefund,
                DiscountView,
                BillingView, BillingCreate, BillingExport,
                NotificationView
            },

            Roles.Kitchen => new[]
            {
                MenuView,
                OrderView,
                KotView, KotUpdate,
                InventoryView,
                NotificationView
            },

            Roles.Waiter => new[]
            {
                MenuView,
                OrderView, OrderCreate, OrderUpdate,
                KotView,
                TableView, TableUpdate,
                CustomerView,
                NotificationView
            },

            Roles.Delivery => new[]
            {
                OrderView, OrderUpdate,
                CustomerView,
                NotificationView
            },

            Roles.Customer => new[]
            {
                MenuView,
                OrderView, OrderCreate,
                NotificationView
            },

            _ => Array.Empty<string>()
        };
    }
}
