using FluentValidation;
using RestaurantManagement.Application.DTOs.Menu;

namespace RestaurantManagement.Application.Validators;

public class CreateMenuItemValidator : AbstractValidator<CreateMenuItemDto>
{
    public CreateMenuItemValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category is required.");

        RuleFor(x => x.PreparationTime)
            .GreaterThan(0).When(x => x.PreparationTime.HasValue)
            .WithMessage("Preparation time must be greater than 0.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).When(x => x.Description != null)
            .WithMessage("Description must not exceed 1000 characters.");
    }
}
