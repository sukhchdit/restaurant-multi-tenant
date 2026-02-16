using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddManualPricingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DiscountPercentage",
                table: "orders",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ExtraCharges",
                table: "orders",
                type: "decimal(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "GstAmount",
                table: "orders",
                type: "decimal(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "GstPercentage",
                table: "orders",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsGstApplied",
                table: "orders",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "PaidAmount",
                table: "orders",
                type: "decimal(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "VatAmount",
                table: "orders",
                type: "decimal(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "VatPercentage",
                table: "orders",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DiscountPercentage",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ExtraCharges",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "GstAmount",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "GstPercentage",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "IsGstApplied",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "PaidAmount",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "VatAmount",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "VatPercentage",
                table: "orders");
        }
    }
}
