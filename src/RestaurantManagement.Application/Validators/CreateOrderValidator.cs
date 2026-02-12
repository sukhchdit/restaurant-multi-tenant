using FluentValidation;
using RestaurantManagement.Application.DTOs.Order;

namespace RestaurantManagement.Application.Validators;

public class CreateOrderValidator : AbstractValidator<CreateOrderDto>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.OrderType)
            .IsInEnum().WithMessage("Invalid order type.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Order must have at least one item.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.MenuItemId)
                .NotEmpty().WithMessage("Menu item ID is required.");

            item.RuleFor(i => i.Quantity)
                .GreaterThan(0).WithMessage("Quantity must be greater than 0.");
        });

        RuleFor(x => x.DeliveryAddress)
            .NotEmpty().When(x => x.OrderType == Domain.Enums.OrderType.Delivery)
            .WithMessage("Delivery address is required for delivery orders.");
    }
}
