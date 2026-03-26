using System.Globalization;
using System.IO.Compression;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.Models;

namespace CRM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ExportController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ExportController> _logger;

    public ExportController(ApplicationDbContext context, ILogger<ExportController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    [HttpGet("partner-profile")]
    [Authorize(Roles = "Partner")]
    public async Task<IActionResult> ExportPartnerProfile([FromQuery] string? preset = "generic")
    {
        try
        {
            const decimal commissionRate = 10m;
            var exportPreset = ParsePreset(preset);
            var partnerId = GetCurrentUserId();
            var partner = await _context.Users.FirstOrDefaultAsync(u => u.UserId == partnerId);
            if (partner == null)
            {
                return NotFound("Partner not found");
            }

            var leads = await _context.Leads
                .Where(l => l.CreatedBy == partnerId)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();

            var customers = await _context.Customers
                .Where(c => c.CreatedBy == partnerId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var orders = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.ProductVariant)
                .Where(o => o.CreatedBy == partnerId)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            var subscriptions = await _context.Subscriptions
                .Include(s => s.Order)
                .Include(s => s.Customer)
                .Include(s => s.ProductVariant)
                .Where(s => s.Order.CreatedBy == partnerId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            var products = await _context.ProductVariants
                .Where(p => p.IsActive)
                .OrderBy(p => p.DisplayOrder)
                .ToListAsync();

            using var output = new MemoryStream();
            using (var archive = new ZipArchive(output, ZipArchiveMode.Create, true))
            {
                var prefix = exportPreset.ToString().ToLowerInvariant();
                AddZipEntry(archive, "manifest.txt", BuildManifest(exportPreset, partner, leads.Count, customers.Count, orders.Count, subscriptions.Count, products.Count));
                AddZipEntry(archive, $"{prefix}_import_mapping_guide.txt", BuildMappingGuide(exportPreset));

                AddZipEntry(archive, $"{prefix}_leads.csv", BuildLeadsCsv(exportPreset, leads));
                AddZipEntry(archive, $"{prefix}_customers.csv", BuildCustomersCsv(exportPreset, customers));
                AddZipEntry(archive, $"{prefix}_orders.csv", BuildOrdersCsv(exportPreset, orders));
                AddZipEntry(archive, $"{prefix}_subscriptions.csv", BuildSubscriptionsCsv(exportPreset, subscriptions));
                AddZipEntry(archive, $"{prefix}_products.csv", BuildProductsCsv(exportPreset, products));
                AddZipEntry(archive, $"{prefix}_earnings.csv", BuildEarningsCsv(exportPreset, orders, commissionRate));
            }

            output.Position = 0;
            var safePartnerName = string.Join("_", partner.Name.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries))
                .Replace(' ', '_');
            var filename = $"crm_partner_export_{exportPreset.ToString().ToLowerInvariant()}_{safePartnerName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.zip";

            return File(output.ToArray(), "application/zip", filename);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting partner profile");
            return StatusCode(500, "Error generating export");
        }
    }

    private static void AddZipEntry(ZipArchive archive, string filename, string content)
    {
        var entry = archive.CreateEntry(filename, CompressionLevel.Fastest);
        using var stream = entry.Open();
        using var writer = new StreamWriter(stream, new UTF8Encoding(true));
        writer.Write(content);
    }

    private static ExportPreset ParsePreset(string? preset)
    {
        if (string.IsNullOrWhiteSpace(preset)) return ExportPreset.Generic;
        return preset.Trim().ToLowerInvariant() switch
        {
            "zoho" => ExportPreset.Zoho,
            "hubspot" => ExportPreset.HubSpot,
            "salesforce" => ExportPreset.Salesforce,
            _ => ExportPreset.Generic,
        };
    }

    private static string BuildManifest(ExportPreset preset, User partner, int leads, int customers, int orders, int subscriptions, int products)
    {
        return string.Join('\n', new[]
        {
            "CRM Partner Export",
            $"Generated At (UTC): {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}",
            $"Export Preset: {preset}",
            $"Partner Name: {partner.Name}",
            $"Partner Email: {partner.Email}",
            "",
            "Included Files:",
            $"- leads.csv ({leads} rows)",
            $"- customers.csv ({customers} rows)",
            $"- orders.csv ({orders} rows)",
            $"- subscriptions.csv ({subscriptions} rows)",
            $"- products.csv ({products} rows)",
            $"- earnings.csv ({orders} rows)",
            "",
            "This export is designed for spreadsheet/CRM imports (Zoho, HubSpot, Salesforce, etc.)."
        });
    }

    private static string BuildMappingGuide(ExportPreset preset)
    {
        if (preset == ExportPreset.HubSpot)
        {
            return string.Join('\n', new[]
            {
                "HubSpot CRM Import Mapping Guide",
                "",
                "1) Leads/Contacts: import leads.csv",
                "   Company Name -> Company name",
                "   Contact Name -> First/Last name (split if needed)",
                "   Email -> Email",
                "   Phone -> Phone number",
                "   Lead Status -> Lifecycle stage / custom status",
                "",
                "2) Companies: import customers.csv",
                "   Company Name -> Company name",
                "   Industry -> Industry",
                "   Website -> Company domain name",
                "",
                "3) Deals: import orders.csv",
                "   Order Number -> Deal name",
                "   Total Amount -> Amount",
                "   Order Status -> Deal stage",
                "   Order Date -> Close date",
                "",
                "4) Products: import products.csv",
                "5) Earnings: import earnings.csv into custom object/reporting",
            });
        }

        if (preset == ExportPreset.Salesforce)
        {
            return string.Join('\n', new[]
            {
                "Salesforce Import Mapping Guide",
                "",
                "1) Leads Object: import leads.csv",
                "   Company Name -> Company",
                "   Contact Name -> LastName",
                "   Email -> Email",
                "   Phone -> Phone",
                "   Lead Status -> Status",
                "",
                "2) Accounts/Contacts: import customers.csv",
                "   Company Name -> Account Name",
                "   Contact Person -> Contact Name",
                "",
                "3) Opportunities: import orders.csv",
                "   Order Number -> Opportunity Name",
                "   Total Amount -> Amount",
                "   Order Date -> CloseDate",
                "   Order Status -> StageName",
                "",
                "4) Products/Price Books: import products.csv",
                "5) Earnings: import earnings.csv as custom object/report",
            });
        }

        return string.Join('\n', new[]
        {
            preset == ExportPreset.Zoho ? "Zoho CRM Import Mapping Guide" : "Generic CRM Import Mapping Guide",
            "",
            "1) Leads Module -> import leads.csv",
            "   Suggested mapping:",
            "   Company Name -> Company",
            "   Contact Name -> Last Name (or Full Name custom field)",
            "   Email -> Email",
            "   Phone -> Phone",
            "   Lead Source -> Lead Source",
            "   Lead Status -> Lead Status",
            "   Rating -> Rating",
            "   Estimated Value -> Potential Amount (custom)",
            "",
            "2) Accounts/Contacts Module -> import customers.csv",
            "   Company Name -> Account Name",
            "   Contact Person -> Contact Name",
            "   Email -> Email",
            "   Phone -> Phone",
            "   Industry -> Industry",
            "",
            "3) Deals/Sales Module -> import orders.csv",
            "   Order Number -> Deal Name / Reference",
            "   Customer Company -> Account Name",
            "   Product Variant -> Product",
            "   Total Amount -> Amount",
            "   Status -> Stage",
            "   Order Date -> Closing Date",
            "",
            "4) Subscriptions / Recurring Revenue -> import subscriptions.csv",
            "",
            "5) Products Module -> import products.csv",
            "",
            "6) Commission Tracking -> import earnings.csv",
            "",
            "Tip: Use UTF-8 encoding and map date fields using YYYY-MM-DD format."
        });
    }

    private static string BuildLeadsCsv(ExportPreset preset, List<Lead> leads)
    {
        var header = preset switch
        {
            ExportPreset.Zoho => CsvRow("Lead ID", "Company", "Full Name", "Email", "Phone", "Website", "Industry", "Lead Source", "Lead Status", "Rating", "Potential Amount", "Expected Close Date", "Notes", "Created Time"),
            ExportPreset.HubSpot => CsvRow("Record ID", "Company name", "Full name", "Email", "Phone number", "Website URL", "Industry", "Lead source", "Lifecycle stage", "Lead rating", "Deal amount", "Close date", "Notes", "Create date"),
            ExportPreset.Salesforce => CsvRow("LeadId", "Company", "LastName", "Email", "Phone", "Website", "Industry", "LeadSource", "Status", "Rating", "Amount", "CloseDate", "Description", "CreatedDate"),
            _ => CsvRow("Lead ID", "Company Name", "Contact Name", "Email", "Phone", "Website", "Industry", "Lead Source", "Lead Status", "Rating", "Estimated Value", "Expected Close Date", "Notes", "Created At"),
        };

        var rows = new List<string>
        {
            header
        };

        rows.AddRange(leads.Select(l => CsvRow(
            l.LeadId,
            l.CompanyName,
            preset == ExportPreset.Salesforce ? LastNameFromFullName(l.ContactName) : l.ContactName,
            l.Email,
            l.Phone,
            l.Website,
            l.Industry,
            MapLeadSourceForPreset(preset, l.LeadSource?.ToString()),
            MapLeadStatusForPreset(preset, l.Status.ToString()),
            l.Rating?.ToString(),
            ToMoney(l.EstimatedValue),
            ToPresetDate(preset, l.ExpectedCloseDate),
            l.Notes,
            ToPresetDateTime(preset, l.CreatedAt)
        )));

        return string.Join('\n', rows);
    }

    private static string BuildCustomersCsv(ExportPreset preset, List<Customer> customers)
    {
        var header = preset switch
        {
            ExportPreset.Zoho => CsvRow("Customer ID", "Account Name", "Contact Name", "Email", "Phone", "Website", "Industry", "Customer Type", "Billing Address", "Billing City", "Billing State", "Billing Country", "GST Number", "PAN Number", "Created Time"),
            ExportPreset.HubSpot => CsvRow("Record ID", "Company name", "Primary contact", "Email", "Phone number", "Website URL", "Industry", "Type", "Address", "City", "State", "Country", "Tax Number", "PAN Number", "Create date"),
            ExportPreset.Salesforce => CsvRow("CustomerId", "AccountName", "ContactName", "Email", "Phone", "Website", "Industry", "Type", "BillingStreet", "BillingCity", "BillingState", "BillingCountry", "TaxId", "PAN", "CreatedDate"),
            _ => CsvRow("Customer ID", "Company Name", "Contact Person", "Email", "Phone", "Website", "Industry", "Customer Type", "Billing Address", "Billing City", "Billing State", "Billing Country", "GST Number", "PAN Number", "Created At"),
        };

        var rows = new List<string>
        {
            header
        };

        rows.AddRange(customers.Select(c => CsvRow(
            c.CustomerId,
            c.CompanyName,
            preset == ExportPreset.Salesforce ? LastNameFromFullName(c.ContactPerson) : c.ContactPerson,
            c.Email,
            c.Phone,
            c.Website,
            c.Industry,
            c.CustomerType.ToString(),
            c.BillingAddress,
            c.BillingCity,
            c.BillingState,
            c.BillingCountry,
            c.GSTNumber,
            c.PANNumber,
            ToPresetDateTime(preset, c.CreatedAt)
        )));

        return string.Join('\n', rows);
    }

    private static string BuildOrdersCsv(ExportPreset preset, List<Order> orders)
    {
        var header = preset switch
        {
            ExportPreset.Zoho => CsvRow("Order ID", "Deal Name", "Closing Date", "Account Name", "Product", "License Type", "Quantity", "Base Amount", "Discount", "Tax", "Amount", "Stage", "Payment Status", "Expected Delivery", "Notes"),
            ExportPreset.HubSpot => CsvRow("Record ID", "Deal name", "Close date", "Company", "Product", "License type", "Quantity", "Base amount", "Discount", "Tax", "Amount", "Deal stage", "Payment status", "Expected delivery", "Notes"),
            ExportPreset.Salesforce => CsvRow("OrderId", "OpportunityName", "CloseDate", "AccountName", "Product", "LicenseType", "Quantity", "BaseAmount", "Discount", "Tax", "Amount", "StageName", "PaymentStatus", "ExpectedDeliveryDate", "Description"),
            _ => CsvRow("Order ID", "Order Number", "Order Date", "Customer Company", "Product Variant", "License Type", "Quantity", "Base Amount", "Discount Amount", "Tax Amount", "Total Amount", "Order Status", "Payment Status", "Expected Delivery Date", "Notes"),
        };

        var rows = new List<string>
        {
            header
        };

        rows.AddRange(orders.Select(o => CsvRow(
            o.OrderId,
            preset == ExportPreset.Zoho ? $"Deal - {o.OrderNumber}" : o.OrderNumber,
            ToPresetDate(preset, o.OrderDate),
            o.Customer?.CompanyName,
            o.ProductVariant?.VariantName,
            o.UserLicenseType.ToString(),
            o.Quantity,
            ToMoney(o.BaseAmount),
            ToMoney(o.DiscountAmount),
            ToMoney(o.TaxAmount),
            ToMoney(o.TotalAmount),
            MapOrderStatusForPreset(preset, o.Status.ToString()),
            o.PaymentStatus.ToString(),
            ToPresetDate(preset, o.ExpectedDeliveryDate),
            o.Notes
        )));

        return string.Join('\n', rows);
    }

    private static string BuildSubscriptionsCsv(ExportPreset preset, List<Subscription> subscriptions)
    {
        var header = preset switch
        {
            ExportPreset.Zoho => CsvRow("Subscription ID", "Subscription Name", "Account Name", "Product", "Order Number", "Start Date", "Renewal Date", "Annual Fee", "Status", "Auto Renew", "Renewal Count"),
            ExportPreset.HubSpot => CsvRow("Record ID", "Subscription name", "Company", "Product", "Order number", "Start date", "Renewal date", "Annual fee", "Status", "Auto renew", "Renewal count"),
            ExportPreset.Salesforce => CsvRow("SubscriptionId", "SubscriptionName", "AccountName", "Product", "OrderNumber", "StartDate", "RenewalDate", "AnnualFee", "Status", "AutoRenew", "RenewalCount"),
            _ => CsvRow("Subscription ID", "Subscription Number", "Customer Company", "Product Variant", "Order Number", "Start Date", "Renewal Date", "Annual Fee", "Status", "Auto Renew", "Renewal Count"),
        };

        var rows = new List<string>
        {
            header
        };

        rows.AddRange(subscriptions.Select(s => CsvRow(
            s.SubscriptionId,
            s.SubscriptionNumber,
            s.Customer?.CompanyName,
            s.ProductVariant?.VariantName,
            s.Order?.OrderNumber,
            ToPresetDate(preset, s.StartDate),
            ToPresetDate(preset, s.RenewalDate),
            ToMoney(s.AnnualFee),
            MapSubscriptionStatusForPreset(preset, s.Status.ToString()),
            s.AutoRenew ? "Yes" : "No",
            s.RenewalCount
        )));

        return string.Join('\n', rows);
    }

    private static string BuildProductsCsv(ExportPreset preset, List<ProductVariant> products)
    {
        var header = preset switch
        {
            ExportPreset.Zoho => CsvRow("Product ID", "Product Name", "Product Code", "Description", "Unit Price (Single)", "Unit Price (Multi)", "Annual Fee", "Active", "Display Order"),
            ExportPreset.HubSpot => CsvRow("Record ID", "Product name", "SKU", "Description", "Single-user price", "Multi-user price", "Annual fee", "Active", "Display order"),
            ExportPreset.Salesforce => CsvRow("ProductId", "ProductName", "ProductCode", "Description", "SingleUserPrice", "MultiUserPrice", "AnnualFee", "IsActive", "DisplayOrder"),
            _ => CsvRow("Product ID", "Product Name", "Product Code", "Description", "Single User Price", "Multi User Price", "Annual Subscription Fee", "Is Active", "Display Order"),
        };

        var rows = new List<string>
        {
            header
        };

        rows.AddRange(products.Select(p => CsvRow(
            p.VariantId,
            p.VariantName,
            p.VariantCode,
            p.Description,
            ToMoney(p.BasePriceSingleUser),
            ToMoney(p.BasePriceMultiUser),
            ToMoney(p.AnnualSubscriptionFee),
            p.IsActive ? "Yes" : "No",
            p.DisplayOrder
        )));

        return string.Join('\n', rows);
    }

    private static string BuildEarningsCsv(ExportPreset preset, List<Order> orders, decimal commissionRate)
    {
        var header = preset switch
        {
            ExportPreset.Zoho => CsvRow("Deal Name", "Closing Date", "Account Name", "Deal Amount", "Commission Rate", "Earning Amount", "Stage"),
            ExportPreset.HubSpot => CsvRow("Deal name", "Close date", "Company", "Deal amount", "Commission rate", "Earning amount", "Deal stage"),
            ExportPreset.Salesforce => CsvRow("OpportunityName", "CloseDate", "AccountName", "Amount", "CommissionRate", "EarningAmount", "StageName"),
            _ => CsvRow("Order Number", "Order Date", "Customer Company", "Order Amount", "Commission Rate", "Earning Amount", "Order Status"),
        };

        var rows = new List<string>
        {
            header
        };

        rows.AddRange(orders.Select(o =>
        {
            var earning = (o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PaymentReceived)
                ? Math.Round(o.TotalAmount * commissionRate / 100m, 2)
                : 0m;

            return CsvRow(
                preset == ExportPreset.Zoho ? $"Deal - {o.OrderNumber}" : o.OrderNumber,
                ToPresetDate(preset, o.OrderDate),
                o.Customer?.CompanyName,
                ToMoney(o.TotalAmount),
                commissionRate.ToString("0.##", CultureInfo.InvariantCulture),
                ToMoney(earning),
                MapOrderStatusForPreset(preset, o.Status.ToString())
            );
        }));

        return string.Join('\n', rows);
    }

    private static string CsvRow(params object?[] values)
    {
        return string.Join(',', values.Select(CsvEscape));
    }

    private static string CsvEscape(object? value)
    {
        var text = Convert.ToString(value, CultureInfo.InvariantCulture) ?? string.Empty;
        text = text.Replace("\r", " ").Replace("\n", " ");
        if (text.Contains(',') || text.Contains('"'))
        {
            text = $"\"{text.Replace("\"", "\"\"")}\"";
        }
        return text;
    }

    private static string ToDate(DateTime? value)
    {
        return value?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? string.Empty;
    }

    private static string ToPresetDate(ExportPreset preset, DateTime? value)
    {
        if (!value.HasValue) return string.Empty;
        return preset switch
        {
            ExportPreset.Zoho => value.Value.ToString("dd-MMM-yyyy", CultureInfo.InvariantCulture),
            ExportPreset.HubSpot => value.Value.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture),
            ExportPreset.Salesforce => value.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            _ => value.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
        };
    }

    private static string ToDateTime(DateTime? value)
    {
        return value?.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture) ?? string.Empty;
    }

    private static string ToPresetDateTime(ExportPreset preset, DateTime? value)
    {
        if (!value.HasValue) return string.Empty;
        return preset switch
        {
            ExportPreset.Zoho => value.Value.ToString("dd-MMM-yyyy HH:mm:ss", CultureInfo.InvariantCulture),
            ExportPreset.HubSpot => value.Value.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture),
            ExportPreset.Salesforce => value.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture),
            _ => value.Value.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
        };
    }

    private static string MapLeadStatusForPreset(ExportPreset preset, string? status)
    {
        var value = status ?? string.Empty;
        if (preset == ExportPreset.HubSpot)
        {
            return value switch
            {
                "New" => "subscriber",
                "Demo" => "lead",
                "Converted" => "customer",
                "Lost" => "unqualified",
                _ => "lead",
            };
        }
        if (preset == ExportPreset.Salesforce)
        {
            return value switch
            {
                "New" => "Open - Not Contacted",
                "Demo" => "Working - Contacted",
                "Converted" => "Qualified",
                "Lost" => "Closed - Not Converted",
                _ => value,
            };
        }
        return value;
    }

    private static string MapOrderStatusForPreset(ExportPreset preset, string? status)
    {
        var value = status ?? string.Empty;
        if (preset == ExportPreset.HubSpot)
        {
            return value switch
            {
                "Pending" => "appointmentscheduled",
                "Confirmed" => "contractsent",
                "Delivered" => "closedwon",
                "Cancelled" => "closedlost",
                _ => "qualifiedtobuy",
            };
        }
        if (preset == ExportPreset.Salesforce)
        {
            return value switch
            {
                "Pending" => "Prospecting",
                "Confirmed" => "Negotiation/Review",
                "Delivered" => "Closed Won",
                "Cancelled" => "Closed Lost",
                _ => "Qualification",
            };
        }
        return value;
    }

    private static string MapSubscriptionStatusForPreset(ExportPreset preset, string? status)
    {
        var value = status ?? string.Empty;
        if (preset == ExportPreset.HubSpot)
        {
            return value switch
            {
                "Active" => "active",
                "Expired" => "inactive",
                "Cancelled" => "cancelled",
                "Suspended" => "paused",
                _ => value.ToLowerInvariant(),
            };
        }
        return value;
    }

    private static string MapLeadSourceForPreset(ExportPreset preset, string? source)
    {
        var value = source ?? string.Empty;
        if (preset == ExportPreset.HubSpot)
        {
            return value.ToLowerInvariant();
        }
        return value;
    }

    private static string LastNameFromFullName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return "Unknown";
        var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length == 0 ? "Unknown" : parts[^1];
    }

    private static string ToMoney(decimal? value)
    {
        return (value ?? 0m).ToString("0.00", CultureInfo.InvariantCulture);
    }
}

public enum ExportPreset
{
    Generic,
    Zoho,
    HubSpot,
    Salesforce,
}
