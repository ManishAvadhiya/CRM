using Microsoft.EntityFrameworkCore;
using CRM.API.Models;

namespace CRM.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Lead> Leads { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<ProductVariant> ProductVariants { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<Subscription> Subscriptions { get; set; }
    public DbSet<Activity> Activities { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Ignore invalid Customer → Lead navigation (avoids EF conflict)
        modelBuilder.Entity<Customer>().Ignore(c => c.Lead);

        // Enum → string conversions
        modelBuilder.Entity<User>().Property(u => u.Role).HasConversion<string>();

        modelBuilder.Entity<Lead>().Property(l => l.Status).HasConversion<string>();
        modelBuilder.Entity<Lead>().Property(l => l.LeadSource).HasConversion<string>();
        modelBuilder.Entity<Lead>().Property(l => l.Rating).HasConversion<string>();

        modelBuilder.Entity<Customer>().Property(c => c.CustomerType).HasConversion<string>();

        modelBuilder.Entity<Order>().Property(o => o.Status).HasConversion<string>();
        modelBuilder.Entity<Order>().Property(o => o.PaymentStatus).HasConversion<string>();
        modelBuilder.Entity<Order>().Property(o => o.UserLicenseType).HasConversion<string>();

        modelBuilder.Entity<Subscription>().Property(s => s.Status).HasConversion<string>();

        modelBuilder.Entity<Activity>().Property(a => a.ActivityType).HasConversion<string>();
        modelBuilder.Entity<Activity>().Property(a => a.RelatedToType).HasConversion<string>();
        modelBuilder.Entity<Activity>().Property(a => a.Status).HasConversion<string>();
        modelBuilder.Entity<Activity>().Property(a => a.Priority).HasConversion<string>();

        modelBuilder.Entity<Notification>().Property(n => n.NotificationType).HasConversion<string>();
        modelBuilder.Entity<Notification>().Property(n => n.Priority).HasConversion<string>();

        // Global soft delete filter
        modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
        modelBuilder.Entity<Lead>().HasQueryFilter(l => !l.IsDeleted);
        modelBuilder.Entity<Customer>().HasQueryFilter(c => !c.IsDeleted);
        modelBuilder.Entity<ProductVariant>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<Order>().HasQueryFilter(o => !o.IsDeleted);
        modelBuilder.Entity<Subscription>().HasQueryFilter(s => !s.IsDeleted);
        modelBuilder.Entity<Activity>().HasQueryFilter(a => !a.IsDeleted);
        modelBuilder.Entity<Notification>().HasQueryFilter(n => !n.IsDeleted);

        // Relationship: Lead → ConvertedCustomer
        modelBuilder.Entity<Lead>()
            .HasOne(l => l.ConvertedCustomer)
            .WithMany()
            .HasForeignKey(l => l.ConvertedToCustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        // Relationship: Order → Customer
        modelBuilder.Entity<Order>()
            .HasOne(o => o.Customer)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relationship: Subscription → Order (1:1)
        modelBuilder.Entity<Subscription>()
            .HasOne(s => s.Order)
            .WithOne(o => o.Subscription)
            .HasForeignKey<Subscription>(s => s.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        // Activity → User relationships
        modelBuilder.Entity<Activity>()
            .HasOne(a => a.AssignedToUser)
            .WithMany()
            .HasForeignKey(a => a.AssignedTo)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Activity>()
            .HasOne(a => a.CreatedByUser)
            .WithMany()
            .HasForeignKey(a => a.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Activity>()
            .HasOne(a => a.CompletedByUser)
            .WithMany()
            .HasForeignKey(a => a.CompletedBy)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Lead>()
            .HasOne(l => l.AssignedToUser)
            .WithMany()
            .HasForeignKey(l => l.AssignedTo)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<Lead>()
            .HasOne(l => l.CreatedByUser)
            .WithMany()
            .HasForeignKey(l => l.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);
        // Customer → User relationships
        modelBuilder.Entity<Customer>()
            .HasOne(c => c.AccountOwnerUser)
            .WithMany()
            .HasForeignKey(c => c.AccountOwner)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Customer>()
            .HasOne(c => c.CreatedByUser)
            .WithMany()
            .HasForeignKey(c => c.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // Seed initial data
        SeedData(modelBuilder);
    }

    private void SeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasData(
            new User
            {
                UserId = 1,
                Name = "System Admin",
                Email = "admin@crm.com",
                PasswordHash = "$2a$12$0Gr/hdSsyjDE0wyTeg09BOi8jWohJ44vcwzEVcns4jGI81yqZZ0Wu",
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );

        modelBuilder.Entity<ProductVariant>().HasData(
            new ProductVariant
            {
                VariantId = 1,
                VariantName = "Billing",
                VariantCode = "BILLING-001",
                BasePriceSingleUser = 9000m,
                BasePriceMultiUser = 14000m,
                AnnualSubscriptionFee = 2000m,
                Description = "Comprehensive billing and invoicing solution",
                Features = "[\"Feature1\", \"Feature2\"]",
                IsActive = true,
                DisplayOrder = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new ProductVariant
            {
                VariantId = 2,
                VariantName = "Lite",
                VariantCode = "LITE-001",
                BasePriceSingleUser = 11000m,
                BasePriceMultiUser = 16000m,
                AnnualSubscriptionFee = 3000m,
                Description = "Lightweight solution",
                Features = "[\"Feature1\", \"Feature2\"]",
                IsActive = true,
                DisplayOrder = 2,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new ProductVariant
            {
                VariantId = 3,
                VariantName = "Standard",
                VariantCode = "STANDARD-001",
                BasePriceSingleUser = 16000m,
                BasePriceMultiUser = 26000m,
                AnnualSubscriptionFee = 4000m,
                Description = "Full accounting suite",
                Features = "[\"Feature1\", \"Feature2\"]",
                IsActive = true,
                DisplayOrder = 3,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is BaseEntity && e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            ((BaseEntity)entry.Entity).UpdatedAt = DateTime.UtcNow;
        }
    }
}
