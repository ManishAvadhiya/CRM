# CRM Frontend - Quick Reference Guide

## Pages & Features Map

### 🏠 Dashboard (`/`)
- Real-time stats and metrics
- Lead pipeline visualization
- Order status summary
- Subscription status tracking
- Recent activity feed
- Renewal alerts

### 📝 Leads (`/leads`)
- Create new lead
- Edit lead details
- Delete lead (soft delete)
- Convert lead to customer
- Filter by status (New, Contacted, Qualified, Converted, Lost)
- View contact information

### 👥 Customers (`/customers`)
- Create new customer
- View customer details
- Edit customer information
- Delete customer
- View related orders
- View related subscriptions
- Manage address information

### 📦 Orders (`/orders`)
- Create new order with:
  - Customer selection
  - Product variant selection
  - License type (Single/Multi-User)
  - Quantity and pricing
  - Discounts and tax
  - Custom notes
- View order details
- Confirm order (creates subscription)
- Track order status
- View price breakdown

### 🔄 Subscriptions (`/subscriptions`)
- View all subscriptions
- Filter by status (Active, Expired, Cancelled)
- View subscription details
- Check renewal dates
- See upcoming renewals (30-day alert)
- Track auto-renewal status
- View subscription period information

### 📦 Products (`/products`)
- Browse all product variants
- Toggle active/inactive products
- View product pricing:
  - Single User Price
  - Multi User Price
  - Annual Subscription Fee
- View product features and description
- Display order management

### 🔔 Notifications (`/notifications`)
- View all notifications
- Mark individual notification as read
- Mark all notifications as read
- Filter unread only
- See notification types and timestamps
- Unread count badge in sidebar

---

## API Endpoints Used

### Leads
```
GET    /api/leads?status=...          List leads (filterable)
GET    /api/leads/{id}                Get lead details
POST   /api/leads                      Create new lead
PUT    /api/leads/{id}                 Update lead
DELETE /api/leads/{id}                 Delete lead (soft)
POST   /api/leads/{id}/convert         Convert to customer
```

### Customers
```
GET    /api/customers                  List all customers
GET    /api/customers/{id}             Get customer details
POST   /api/customers                  Create new customer
PUT    /api/customers/{id}             Update customer
DELETE /api/customers/{id}             Delete customer (soft)
```

### Orders
```
GET    /api/orders                     List all orders
GET    /api/orders/{id}                Get order details
POST   /api/orders                     Create new order
PUT    /api/orders/{id}/confirm        Confirm order (creates subscription)
```

### Subscriptions
```
GET    /api/subscriptions?status=...   List subscriptions (filterable)
GET    /api/subscriptions/{id}         Get subscription details
GET    /api/subscriptions/upcoming-renewals?days=30   Get renewals
```

### Products
```
GET    /api/productvariants?activeOnly=true   List products
GET    /api/productvariants/{id}              Get product details
```

### Notifications
```
GET    /api/notifications?unreadOnly=...      Get notifications
PUT    /api/notifications/{id}/mark-read      Mark as read
PUT    /api/notifications/mark-all-read       Mark all as read
```

### Dashboard
```
GET    /api/dashboard/stats                   Get stats
GET    /api/dashboard/recent-activities?count=10   Get activities
```

---

## Component Usage Examples

### Create Lead
1. Click "+ Create Lead" button
2. Fill in company details
3. Select status (New/Contacted/Qualified/Converted/Lost)
4. Add notes if needed
5. Click "Create Lead"

### Convert Lead to Customer
1. Open lead card
2. Click "Convert to Customer" button
3. Confirm action
3. Lead converts and customer is created

### Create Order
1. Click "+ Create Order" button
2. Select customer from dropdown
3. Select product variant
4. Choose license type (Single/Multi-User)
5. Set quantity and discounts/tax if needed
6. Click "Create Order"

### Confirm Order
1. Open order details
2. Click "Confirm Order" button
3. Confirm action
4. Order status changes to "Confirmed"
5. Subscription is automatically created

### Manage Renewals
1. Go to Subscriptions page
2. See orange "Renewals in 30 Days" button
3. Click to toggle renewal alert banner
4. Renewals are highlighted with countdown

### Mark Notifications
1. Go to Notifications page
2. Click notification to mark as read
3. Or click "Mark All as Read" to read all
4. Unread count updates in sidebar

---

## Key Features by Module

### 📊 Analytics
- Lead conversion rate calculation
- Revenue tracking
- Order status breakdown
- Subscription health metrics
- Activity feed with timestamps

### 🎯 Filtering & Search
- Lead status filtering
- Subscription status filtering
- Product active/inactive toggle
- Notification unread filter

### 📋 CRUD Operations
- Full Create, Read, Update, Delete on all entities
- Soft delete with confirmation
- Modal-based detail views
- Inline form editing

### 🔔 Notifications
- Real-time notification display
- Unread count badge
- Mark individual or all as read
- Type-based color coding

### 📈 Reporting
- Dashboard stats card
- Lead pipeline visualization
- Order summary
- Subscription tracking
- Activity feed

---

## Form Validation

### Lead Form
- Company Name: Required
- Contact Name: Required
- Status: Required (default: New)
- Optional: Email, Phone, Website, Notes

### Customer Form
- Company Name: Required
- Contact Person: Required
- Customer Type: Required
- Optional: Email, Phone, Website, Addresses, Tax IDs

### Order Form
- Customer: Required (dropdown)
- Product: Required (dropdown)
- License Type: Required
- Quantity: Required, min 1
- Optional: Discounts, Tax, Notes

---

## Keyboard Shortcuts & Tips

### General
- Click outside modal to close
- Confirmation dialogs require explicit confirmation
- Forms auto-close after successful submission
- All dates are formatted consistently

### Status Badges
- Green: Converted, Active, Delivered
- Blue: Qualified
- Yellow: New, Pending
- Red: Expired, Cancelled, Lost
- Orange: Renewal due soon

### Pagination
- Notifications: Shows first 10 recent
- Activities: Shows first 10 recent
- Default: Reload data when needed

---

## Troubleshooting

### Data Not Loading
1. Check API is running
2. Verify authentication token
3. Check browser console for errors
4. Try refreshing page

### Form Submission Failed
1. Check all required fields are filled
2. Verify customer/product exists
3. Check quantity is valid number
4. See console for specific error

### Notifications Not Showing
1. Check Notifications page loads
2. Verify queries are enabled in React Query
3. Check API connection
4. Try marking manually

### Renewal Dates Not Showing
1. Check subscriptions have renewal_date
2. Verify date format in API
3. Check browser locale settings
4. Try refreshing page

---

## Performance Notes

- Data is cached by React Query
- Refetch disabled on window focus (configurable)
- Mutations trigger automatic refetch
- Activities and notifications are limited to 10 items
- Product list is paginated by active status

---

## Accessibility

- All forms have proper labels
- Color coding includes text labels
- Buttons have clear labels
- Modal titles are descriptive
- Status indicators are text + color

---

## Mobile Support

- Responsive grid layouts
- Mobile-friendly modal dialogs
- Touch-friendly button sizes
- Sidebar collapses on mobile (with DashboardLayout)

---

Generated: February 6, 2026
Version: 1.0 Complete
Status: ✅ Production Ready
