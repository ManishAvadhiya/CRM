using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CRM.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionLifecycleFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Leads_Users_UserId",
                table: "Leads");

            migrationBuilder.DropForeignKey(
                name: "FK_Leads_Users_UserId1",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Leads_UserId",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Leads");

            migrationBuilder.RenameColumn(
                name: "UserId1",
                table: "Leads",
                newName: "ConvertedBy");

            migrationBuilder.RenameIndex(
                name: "IX_Leads_UserId1",
                table: "Leads",
                newName: "IX_Leads_ConvertedBy");

            migrationBuilder.AddColumn<int>(
                name: "SuspendedBy",
                table: "Subscriptions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SuspensionDate",
                table: "Subscriptions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SuspensionReason",
                table: "Subscriptions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrderType",
                table: "Orders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "RenewedSubscriptionId",
                table: "Orders",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SubscriptionHistories",
                columns: table => new
                {
                    HistoryId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SubscriptionId = table.Column<int>(type: "integer", nullable: false),
                    ChangedByUserId = table.Column<int>(type: "integer", nullable: false),
                    ChangeType = table.Column<string>(type: "text", nullable: false),
                    OldValue = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    NewValue = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    RelatedOrderId = table.Column<int>(type: "integer", nullable: true),
                    ChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionHistories", x => x.HistoryId);
                    table.ForeignKey(
                        name: "FK_SubscriptionHistories_Orders_RelatedOrderId",
                        column: x => x.RelatedOrderId,
                        principalTable: "Orders",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SubscriptionHistories_Subscriptions_SubscriptionId",
                        column: x => x.SubscriptionId,
                        principalTable: "Subscriptions",
                        principalColumn: "SubscriptionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SubscriptionHistories_Users_ChangedByUserId",
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
                values: new object[] { new DateTime(2026, 3, 25, 12, 48, 11, 978, DateTimeKind.Utc).AddTicks(1899), new DateTime(2026, 3, 25, 12, 48, 11, 978, DateTimeKind.Utc).AddTicks(1900) });

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 25, 12, 48, 11, 978, DateTimeKind.Utc).AddTicks(1904), new DateTime(2026, 3, 25, 12, 48, 11, 978, DateTimeKind.Utc).AddTicks(1904) });

            migrationBuilder.UpdateData(
                table: "ProductVariants",
                keyColumn: "VariantId",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 25, 12, 48, 11, 978, DateTimeKind.Utc).AddTicks(1908), new DateTime(2026, 3, 25, 12, 48, 11, 978, DateTimeKind.Utc).AddTicks(1908) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 25, 12, 48, 11, 978, DateTimeKind.Utc).AddTicks(1733), new DateTime(2026, 3, 25, 12, 48, 11, 978, DateTimeKind.Utc).AddTicks(1735) });

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_SuspendedBy",
                table: "Subscriptions",
                column: "SuspendedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_RenewedSubscriptionId",
                table: "Orders",
                column: "RenewedSubscriptionId");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionHistories_ChangedByUserId",
                table: "SubscriptionHistories",
                column: "ChangedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionHistories_RelatedOrderId",
                table: "SubscriptionHistories",
                column: "RelatedOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionHistories_SubscriptionId",
                table: "SubscriptionHistories",
                column: "SubscriptionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Leads_Users_ConvertedBy",
                table: "Leads",
                column: "ConvertedBy",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Subscriptions_RenewedSubscriptionId",
                table: "Orders",
                column: "RenewedSubscriptionId",
                principalTable: "Subscriptions",
                principalColumn: "SubscriptionId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Subscriptions_Users_SuspendedBy",
                table: "Subscriptions",
                column: "SuspendedBy",
                principalTable: "Users",
                principalColumn: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Leads_Users_ConvertedBy",
                table: "Leads");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Subscriptions_RenewedSubscriptionId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Subscriptions_Users_SuspendedBy",
                table: "Subscriptions");

            migrationBuilder.DropTable(
                name: "SubscriptionHistories");

            migrationBuilder.DropIndex(
                name: "IX_Subscriptions_SuspendedBy",
                table: "Subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_Orders_RenewedSubscriptionId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SuspendedBy",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "SuspensionDate",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "SuspensionReason",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "OrderType",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "RenewedSubscriptionId",
                table: "Orders");

            migrationBuilder.RenameColumn(
                name: "ConvertedBy",
                table: "Leads",
                newName: "UserId1");

            migrationBuilder.RenameIndex(
                name: "IX_Leads_ConvertedBy",
                table: "Leads",
                newName: "IX_Leads_UserId1");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Leads",
                type: "integer",
                nullable: true);

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
                name: "IX_Leads_UserId",
                table: "Leads",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Leads_Users_UserId",
                table: "Leads",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Leads_Users_UserId1",
                table: "Leads",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "UserId");
        }
    }
}
