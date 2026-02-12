namespace RestaurantManagement.Application.DTOs.Billing;

public class TaxCalculationDto
{
    public decimal SubTotal { get; set; }
    public decimal CgstRate { get; set; }
    public decimal SgstRate { get; set; }
    public decimal CgstAmount { get; set; }
    public decimal SgstAmount { get; set; }
    public decimal TotalTaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
}
