using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM.API.Migrations
{
    /// <inheritdoc />
    public partial class passChnaged : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 4, 18, 37, 40, 413, DateTimeKind.Utc).AddTicks(2540), new DateTime(2026, 2, 4, 18, 37, 40, 413, DateTimeKind.Utc).AddTicks(2540) });

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 4, 18, 37, 40, 413, DateTimeKind.Utc).AddTicks(2540), new DateTime(2026, 2, 4, 18, 37, 40, 413, DateTimeKind.Utc).AddTicks(2540) });

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 4, 18, 37, 40, 413, DateTimeKind.Utc).AddTicks(2550), new DateTime(2026, 2, 4, 18, 37, 40, 413, DateTimeKind.Utc).AddTicks(2550) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 4, 18, 37, 40, 413, DateTimeKind.Utc).AddTicks(2450), "$2a$12$0Gr/hdSsyjDE0wyTeg09BOi8jWohJ44vcwzEVcns4jGI81yqZZ0Wu", new DateTime(2026, 2, 4, 18, 37, 40, 413, DateTimeKind.Utc).AddTicks(2450) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 4, 18, 21, 32, 710, DateTimeKind.Utc).AddTicks(3800), new DateTime(2026, 2, 4, 18, 21, 32, 710, DateTimeKind.Utc).AddTicks(3800) });

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 4, 18, 21, 32, 710, DateTimeKind.Utc).AddTicks(3800), new DateTime(2026, 2, 4, 18, 21, 32, 710, DateTimeKind.Utc).AddTicks(3800) });

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 4, 18, 21, 32, 710, DateTimeKind.Utc).AddTicks(3800), new DateTime(2026, 2, 4, 18, 21, 32, 710, DateTimeKind.Utc).AddTicks(3800) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 4, 18, 21, 32, 710, DateTimeKind.Utc).AddTicks(3600), "$2a$11$Xq8Z8pQj5X5pF5nX5X5X5.X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5", new DateTime(2026, 2, 4, 18, 21, 32, 710, DateTimeKind.Utc).AddTicks(3600) });
        }
    }
}
