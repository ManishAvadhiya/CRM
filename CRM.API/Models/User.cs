using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRM.API.Models;

public class User : BaseEntity
{
    [Key]
    public int UserId { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;
    
    [Required]
    public UserRole Role { get; set; } = UserRole.SalesPerson;
    
    [MaxLength(20)]
    public string? Phone { get; set; }
    
    [MaxLength(255)]
    public string? ProfileImage { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public DateTime? LastLogin { get; set; }
    
    // Navigation Properties
    public ICollection<Lead> AssignedLeads { get; set; } = new List<Lead>();
    public ICollection<Customer> ManagedCustomers { get; set; } = new List<Customer>();
    public ICollection<Activity> CreatedActivities { get; set; } = new List<Activity>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}

public enum UserRole
{
    Admin,
    SalesPerson
}
