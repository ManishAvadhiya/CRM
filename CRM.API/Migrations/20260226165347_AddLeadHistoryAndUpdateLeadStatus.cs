using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CRM.API.Migrations
{
    /// <inheritdoc />
    public partial class AddLeadHistoryAndUpdateLeadStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LeadHistories",
                columns: table => new
                {
                    HistoryId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LeadId = table.Column<int>(type: "integer", nullable: false),
                    ChangedByUserId = table.Column<int>(type: "integer", nullable: false),
                    ChangeType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OldValue = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    NewValue = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeadHistories", x => x.HistoryId);
                    table.ForeignKey(
                        name: "FK_LeadHistories_Leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "Leads",
                        principalColumn: "LeadId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeadHistories_Users_ChangedByUserId",
                        column: x => x.ChangedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 26, 16, 53, 46, 770, DateTimeKind.Utc).AddTicks(6430), new DateTime(2026, 2, 26, 16, 53, 46, 770, DateTimeKind.Utc).AddTicks(6430) });

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 26, 16, 53, 46, 770, DateTimeKind.Utc).AddTicks(6430), new DateTime(2026, 2, 26, 16, 53, 46, 770, DateTimeKind.Utc).AddTicks(6430) });

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 26, 16, 53, 46, 770, DateTimeKind.Utc).AddTicks(6430), new DateTime(2026, 2, 26, 16, 53, 46, 770, DateTimeKind.Utc).AddTicks(6430) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 26, 16, 53, 46, 770, DateTimeKind.Utc).AddTicks(6280), new DateTime(2026, 2, 26, 16, 53, 46, 770, DateTimeKind.Utc).AddTicks(6280) });

            migrationBuilder.CreateIndex(
                name: "IX_LeadHistories_ChangedByUserId",
                table: "LeadHistories",
                column: "ChangedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_LeadHistories_LeadId",
                table: "LeadHistories",
                column: "LeadId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LeadHistories");

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
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 25, 18, 6, 8, 407, DateTimeKind.Utc).AddTicks(3670), new DateTime(2026, 2, 25, 18, 6, 8, 407, DateTimeKind.Utc).AddTicks(3670) });
        }
    }
}
