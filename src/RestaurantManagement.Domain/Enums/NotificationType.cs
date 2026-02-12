namespace RestaurantManagement.Domain.Enums;

public enum NotificationType
{
    OrderPlaced = 0,
    KOTCreated = 1,
    OrderAccepted = 2,
    OrderRejected = 3,
    OrderReady = 4,
    OrderDelivered = 5,
    LowStock = 6,
    StaffUpdate = 7,
    PaymentReceived = 8,
    NewReservation = 9,
    System = 10
}
