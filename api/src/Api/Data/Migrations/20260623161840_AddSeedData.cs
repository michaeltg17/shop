using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "AdminUsers",
                columns: new[] { "Id", "Email", "FirstName", "IsActive", "LastName", "PhoneNumber" },
                values: new object[,]
                {
                    { 1, "michael@example.com", "Michael", true, "Garcia", "+1-555-0101" },
                    { 2, "sarah@example.com", "Sarah", true, "Johnson", "+1-555-0102" },
                    { 3, "james@example.com", "James", false, "Wilson", "+1-555-0103" }
                });

            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "Id", "Category", "Description", "Image", "Name", "Price" },
                values: new object[,]
                {
                    { 1, "Electronics", "High-performance laptop", "https://placehold.co/400x300/3b82f6/white?text=Laptop", "Laptop", 999.99m },
                    { 2, "Electronics", "Wireless ergonomic mouse", "https://placehold.co/400x300/ef4444/white?text=Mouse", "Mouse", 29.99m },
                    { 3, "Electronics", "Mechanical keyboard", "https://placehold.co/400x300/22c55e/white?text=Keyboard", "Keyboard", 79.99m }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AdminUsers",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "AdminUsers",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "AdminUsers",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3);
        }
    }
}
