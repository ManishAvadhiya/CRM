# 🚀 Quick Start Guide - Mac Setup

## Prerequisites Check

```bash
# Check .NET installation
dotnet --version
# Should show: 8.0.x

# Check MySQL installation
mysql --version
# Should show: mysql Ver 8.0.x

# Check if MySQL is running
brew services list | grep mysql
# Should show: started
```

## Step-by-Step Setup (5 minutes)

### 1. Create Database
```bash
mysql -u root -p
```
```sql
CREATE DATABASE CRM_DB;
EXIT;
```

### 2. Configure Connection String

Open `CRM.API/appsettings.json` and update:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Port=3306;Database=CRM_DB;User=root;Password=YOUR_PASSWORD_HERE;"
}
```

### 3. Install & Run

```bash
cd CRM.API

# Restore packages
dotnet restore

# Run migrations
dotnet ef migrations add InitialCreate
dotnet ef database update

# Run the application
dotnet run
```

### 4. Access Swagger

Open browser: `http://localhost:5000/swagger`

### 5. Login

1. Click on `POST /api/auth/login`
2. Click "Try it out"
3. Use these credentials:
```json
{
  "email": "admin@crm.com",
  "password": "Admin@123"
}
```
4. Copy the `token` from response
5. Click **Authorize** button (top right)
6. Enter: `Bearer YOUR_TOKEN_HERE`
7. Click **Authorize**

### 6. Test API

Now you can test any endpoint! Try:
- GET `/api/productvariants` - See the 3 product variants
- GET `/api/dashboard/stats` - View statistics
- POST `/api/leads` - Create a test lead

## Troubleshooting

### "Connection refused" Error
```bash
# Start MySQL
brew services start mysql

# Verify it's running
brew services list
```

### "Database does not exist"
```bash
# Login to MySQL and create database
mysql -u root -p -e "CREATE DATABASE CRM_DB;"
```

### "dotnet command not found"
```bash
# Install .NET 8 from:
# https://dotnet.microsoft.com/download/dotnet/8.0
```

### Port 5000 Already in Use
```bash
# Change port in launchSettings.json
# Or kill the process using port 5000
lsof -i :5000
kill -9 <PID>
```

## Next Steps

1. ✅ API is running
2. ✅ Admin user exists
3. ✅ 3 Product variants seeded
4. ▶️ Start building your React frontend
5. ▶️ Connect frontend to `http://localhost:5000/api`

## Common Tasks

### Create a New Lead
```bash
POST /api/leads
{
  "companyName": "Test Company",
  "contactName": "John Doe",
  "email": "john@test.com",
  "phone": "9876543210",
  "status": "New"
}
```

### Convert Lead to Customer
```bash
POST /api/leads/1/convert
```

### Create Order
```bash
POST /api/orders
{
  "customerId": 1,
  "variantId": 1,
  "userLicenseType": "SingleUser",
  "quantity": 1
}
```

### Confirm Order (Auto-creates Subscription)
```bash
PUT /api/orders/1/confirm
```

## Email Configuration (Optional)

If you want to enable email notifications:

1. Get Gmail App Password:
   - Go to Google Account → Security
   - 2-Step Verification → App Passwords
   - Generate password for "Mail"

2. Update `appsettings.json`:
```json
"EmailSettings": {
  "SenderEmail": "your-email@gmail.com",
  "Username": "your-email@gmail.com",
  "Password": "your-16-char-app-password"
}
```

## Development Tips

```bash
# Run with hot reload (auto-restart on file changes)
dotnet watch run

# View database tables
mysql -u root -p CRM_DB -e "SHOW TABLES;"

# View users
mysql -u root -p CRM_DB -e "SELECT * FROM Users;"

# View product variants
mysql -u root -p CRM_DB -e "SELECT * FROM ProductVariants;"
```

## Default Data

After setup, you'll have:

✅ **1 Admin User**
- Email: admin@crm.com
- Password: Admin@123

✅ **3 Product Variants**
1. **Billing** - ₹9k (single) / ₹14k (multi) - Annual: ₹2k
2. **Lite** - ₹11k (single) / ₹16k (multi) - Annual: ₹3k
3. **Standard** - ₹16k (single) / ₹26k (multi) - Annual: ₹4k

## Ready to Code! 🎉

Your backend is ready. Start building your React frontend and connect to this API!

Frontend connection example:
```javascript
const API_URL = 'http://localhost:5000/api';
```

---

**Questions?** Check the main README.md for detailed documentation.
