# CRM Backend API - .NET 8

A comprehensive Customer Relationship Management (CRM) system backend built with .NET 8, MySQL, and Entity Framework Core.

## 🚀 Features

- **Authentication & Authorization** - JWT-based authentication with role-based access
- **Lead Management** - Track and convert leads to customers
- **Customer Management** - Comprehensive customer information and history
- **Product Variants** - Three product tiers (Billing, Lite, Standard)
- **Order Management** - Create and manage sales orders
- **Subscription Management** - Automatic subscription creation and renewal tracking
- **Activity Tracking** - Log calls, meetings, emails, tasks, and notes
- **Notification System** - In-app and email notifications
- **Dashboard Analytics** - Real-time statistics and metrics

## 📋 Prerequisites

- macOS (tested on macOS 12+)
- .NET 8 SDK
- MySQL 8.0+
- Visual Studio Code or Visual Studio for Mac

## 🛠️ Installation

### 1. Install .NET 8 SDK

```bash
# Download and install from Microsoft
# Visit: https://dotnet.microsoft.com/download/dotnet/8.0

# Verify installation
dotnet --version
```

### 2. Install MySQL

```bash
# Using Homebrew
brew install mysql

# Start MySQL service
brew services start mysql

# Secure your installation
mysql_secure_installation
```

### 3. Create Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE CRM_DB;
exit;
```

## ⚙️ Configuration

### 1. Update Database Connection String

Edit `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=CRM_DB;User=root;Password=YOUR_MYSQL_PASSWORD;"
  }
}
```

Replace `YOUR_MYSQL_PASSWORD` with your actual MySQL password.

### 2. Configure Email Settings (Optional)

For Gmail, you need to generate an App Password:
1. Go to Google Account Settings
2. Security → 2-Step Verification → App Passwords
3. Generate password for "Mail"

Edit `appsettings.json`:

```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SenderEmail": "your-email@gmail.com",
    "SenderName": "CRM System",
    "Username": "your-email@gmail.com",
    "Password": "YOUR_16_CHAR_APP_PASSWORD",
    "EnableSsl": true
  }
}
```

## 🚀 Running the Application

### 1. Restore Dependencies

```bash
cd CRM.API
dotnet restore
```

### 2. Run Migrations

```bash
# Create initial migration
dotnet ef migrations add InitialCreate

# Update database
dotnet ef database update
```

### 3. Run the Application

```bash
dotnet run
```

The API will be available at:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger UI: `http://localhost:5000/swagger`

## 🔑 Default Credentials

After first run, a default admin user is created:

- **Email:** admin@crm.com
- **Password:** Admin@123

## 📦 Product Variants (Pre-seeded)

### 1. Billing
- **Single User:** ₹9,000
- **Multi User:** ₹14,000
- **Annual Fee:** ₹2,000
- Features: Bill customization, POS, Stock management, GST, Reports

### 2. Lite
- **Single User:** ₹11,000
- **Multi User:** ₹16,000
- **Annual Fee:** ₹3,000
- Features: E-invoicing, Ledgers, GST reports, TDS/TCS, Stock management

### 3. Standard
- **Single User:** ₹16,000
- **Multi User:** ₹26,000
- **Annual Fee:** ₹4,000
- Features: Full billing suite, Production management, MIS reports, Bank reconciliation

## 📚 API Endpoints

### Authentication
```
POST   /api/auth/login          - User login
POST   /api/auth/register       - User registration
```

### Leads
```
GET    /api/leads               - Get all leads
GET    /api/leads/{id}          - Get lead by ID
POST   /api/leads               - Create new lead
PUT    /api/leads/{id}          - Update lead
DELETE /api/leads/{id}          - Delete lead
POST   /api/leads/{id}/convert  - Convert lead to customer
```

### Customers
```
GET    /api/customers           - Get all customers
GET    /api/customers/{id}      - Get customer by ID
POST   /api/customers           - Create new customer
PUT    /api/customers/{id}      - Update customer
DELETE /api/customers/{id}      - Delete customer
```

### Product Variants
```
GET    /api/productvariants     - Get all product variants
GET    /api/productvariants/{id} - Get variant by ID
```

### Orders
```
GET    /api/orders              - Get all orders
GET    /api/orders/{id}         - Get order by ID
POST   /api/orders              - Create new order
PUT    /api/orders/{id}/confirm - Confirm order (creates subscription)
```

### Subscriptions
```
GET    /api/subscriptions                  - Get all subscriptions
GET    /api/subscriptions/{id}             - Get subscription by ID
GET    /api/subscriptions/upcoming-renewals - Get renewals due soon
```

### Notifications
```
GET    /api/notifications                  - Get user notifications
PUT    /api/notifications/{id}/mark-read   - Mark as read
PUT    /api/notifications/mark-all-read    - Mark all as read
```

### Dashboard
```
GET    /api/dashboard/stats                - Get dashboard statistics
GET    /api/dashboard/recent-activities    - Get recent activities
```

## 🔐 Authentication

All endpoints (except login/register) require JWT token in Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🧪 Testing with Swagger

1. Navigate to `http://localhost:5000/swagger`
2. Click **Authorize** button
3. Login to get token:
   - POST `/api/auth/login`
   - Copy the `token` from response
4. Enter token as: `Bearer YOUR_TOKEN`
5. Click **Authorize**
6. Now you can test all protected endpoints

## 📁 Project Structure

```
CRM.API/
├── Controllers/          # API Controllers
│   ├── AuthController.cs
│   ├── LeadsController.cs
│   ├── CustomersController.cs
│   ├── OrdersController.cs
│   ├── SubscriptionsController.cs
│   ├── ProductVariantsController.cs
│   ├── NotificationsController.cs
│   └── DashboardController.cs
├── Models/              # Data models
│   ├── User.cs
│   ├── Lead.cs
│   ├── Customer.cs
│   ├── Order.cs
│   ├── Subscription.cs
│   ├── ProductVariant.cs
│   ├── Activity.cs
│   └── Notification.cs
├── Data/                # Database context
│   └── ApplicationDbContext.cs
├── DTOs/                # Data transfer objects
│   ├── AuthDtos.cs
│   └── ApiResponse.cs
├── Services/            # Business logic services
│   ├── EmailService.cs
│   └── NotificationService.cs
├── Helpers/             # Utility classes
│   └── JwtHelper.cs
├── appsettings.json     # Configuration
└── Program.cs           # Application entry point
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test MySQL connection
mysql -u root -p CRM_DB

# Check if database exists
SHOW DATABASES;

# Check MySQL port
mysql -u root -p -e "SHOW VARIABLES LIKE 'port';"
```

### Migration Issues

```bash
# Remove all migrations
rm -rf Migrations/

# Create fresh migration
dotnet ef migrations add InitialCreate

# Update database
dotnet ef database update
```

### Port Already in Use

```bash
# Check what's using port 5000
lsof -i :5000

# Kill the process
kill -9 PID
```

### Email Not Sending

- Verify Gmail App Password (not regular password)
- Check Gmail security settings
- Enable "Less secure app access" (if needed)
- Check SMTP settings in appsettings.json

## 📝 Common Development Commands

```bash
# Build project
dotnet build

# Run project
dotnet run

# Run with hot reload
dotnet watch run

# Create migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update

# Remove last migration
dotnet ef migrations remove

# Clean build
dotnet clean

# Restore packages
dotnet restore
```

## 🔄 Workflow Example

### Creating a Complete Sale Flow

1. **Create Lead**
```json
POST /api/leads
{
  "companyName": "Tech Corp",
  "contactName": "John Doe",
  "email": "john@techcorp.com",
  "phone": "9876543210",
  "status": "New",
  "assignedTo": 2
}
```

2. **Convert to Customer**
```
POST /api/leads/1/convert
```

3. **Create Order**
```json
POST /api/orders
{
  "customerId": 1,
  "variantId": 2,
  "userLicenseType": "MultiUser",
  "quantity": 1,
  "customizationDetails": "Need custom branding",
  "customizationAmount": 5000
}
```

4. **Confirm Order** (Auto-creates Subscription)
```
PUT /api/orders/1/confirm
```

5. **Check Dashboard Stats**
```
GET /api/dashboard/stats
```

## 📧 Notification Types

The system sends automatic notifications for:
- Lead assigned to sales person
- Lead converted to customer
- Order created
- Order confirmed
- Subscription created
- Subscription renewal due (30, 60, 90 days)
- Task assigned
- Activity overdue

## 🎯 Next Steps for Frontend

1. Build React frontend connecting to this API
2. Use JWT token for authentication
3. Implement role-based UI (Admin vs SalesPerson)
4. Create dashboards with charts
5. Add real-time notifications

## 📄 License

This project is for educational purposes (B.Tech Project).

## 👨‍💻 Support

For issues or questions:
1. Check Swagger documentation at `/swagger`
2. Review logs in console output
3. Check database for data consistency

## 🎓 Project Information

- **Type:** B.Tech Computer Engineering Semester Project
- **Framework:** .NET 8 Web API
- **Database:** MySQL 8.0
- **ORM:** Entity Framework Core
- **Authentication:** JWT Bearer Token

---

**Happy Coding! 🚀**
