using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CRM.API.Migrations
{
    /// <inheritdoc />
    public partial class AddRBACAndPasswordReset : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CreatedByUserId",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserId1",
                table: "Leads",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PasswordResets",
                columns: table => new
                {
                    ResetId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Otp = table.Column<string>(type: "character varying(6)", maxLength: 6, nullable: false),
                    OtpExpiryTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordResets", x => x.ResetId);
                    table.ForeignKey(
                        name: "FK_PasswordResets_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 25, 18, 6, 8, 407, DateTimeKind.Utc).AddTicks(3800), new DateTime(2026, 2, 25, 18, 6, 8, 407, DateTimeKind.Utc).AddTicks(3800) });

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 25, 18, 6, 8, 407, DateTimeKind.Utc).AddTicks(3810), new DateTime(2026, 2, 25, 18, 6, 8, 407, DateTimeKind.Utc).AddTicks(3810) });

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 25, 18, 6, 8, 407, DateTimeKind.Utc).AddTicks(3810), new DateTime(2026, 2, 25, 18, 6, 8, 407, DateTimeKind.Utc).AddTicks(3810) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedAt", "CreatedByUserId", "Role", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 25, 18, 6, 8, 407, DateTimeKind.Utc).AddTicks(3670), null, "ManagementAdmin", new DateTime(2026, 2, 25, 18, 6, 8, 407, DateTimeKind.Utc).AddTicks(3670) });

            migrationBuilder.CreateIndex(
                name: "IX_Users_CreatedByUserId",
                table: "Users",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_UserId1",
                table: "Leads",
                column: "UserId1");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResets_UserId",
                table: "PasswordResets",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Leads_Users_UserId1",
                table: "Leads",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Users_CreatedByUserId",
                table: "Users",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Leads_Users_UserId1",
                table: "Leads");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Users_CreatedByUserId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "PasswordResets");

            migrationBuilder.DropIndex(
                name: "IX_Users_CreatedByUserId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Leads_UserId1",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UserId1",
                table: "Leads");

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 24, 16, 27, 13, 289, DateTimeKind.Utc).AddTicks(4320), new DateTime(2026, 2, 24, 16, 27, 13, 289, DateTimeKind.Utc).AddTicks(4320) });

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 24, 16, 27, 13, 289, DateTimeKind.Utc).AddTicks(4320), new DateTime(2026, 2, 24, 16, 27, 13, 289, DateTimeKind.Utc).AddTicks(4320) });

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 24, 16, 27, 13, 289, DateTimeKind.Utc).AddTicks(4320), new DateTime(2026, 2, 24, 16, 27, 13, 289, DateTimeKind.Utc).AddTicks(4320) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedAt", "Role", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 24, 16, 27, 13, 289, DateTimeKind.Utc).AddTicks(4060), "Admin", new DateTime(2026, 2, 24, 16, 27, 13, 289, DateTimeKind.Utc).AddTicks(4060) });
        }
    }
}
