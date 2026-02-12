namespace RestaurantManagement.Domain.Entities;

public class ExpenseCategory : TenantEntity
{
    public string Name { get; set; } = string.Empty;

    // Navigation properties
    public virtual ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}
