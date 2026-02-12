using FluentValidation;
using RestaurantManagement.Application.DTOs.Table;

namespace RestaurantManagement.Application.Validators;

public class CreateTableValidator : AbstractValidator<CreateTableDto>
{
    public CreateTableValidator()
    {
        RuleFor(x => x.TableNumber)
            .NotEmpty().WithMessage("Table number is required.")
            .MaximumLength(20).WithMessage("Table number must not exceed 20 characters.");

        RuleFor(x => x.Capacity)
            .GreaterThan(0).WithMessage("Capacity must be greater than 0.")
            .LessThanOrEqualTo(50).WithMessage("Capacity cannot exceed 50.");

        RuleFor(x => x.FloorNumber)
            .GreaterThanOrEqualTo(0).When(x => x.FloorNumber.HasValue)
            .WithMessage("Floor number must be 0 or greater.");
    }
}
