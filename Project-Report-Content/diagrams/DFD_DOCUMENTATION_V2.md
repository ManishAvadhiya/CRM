# Data Flow Diagram (DFD) Documentation - REVISED
## CRM System: Lead, Customer, Order & Subscription Management

**Last Updated:** March 26, 2026  
**Version:** 2.0 (Comprehensive)

---

## 📊 Overview

This document describes the complete and accurate Data Flow Diagrams (DFD) for the CRM system based on thorough codebase analysis. The DFDs use standard Gane-Sarson notation with two levels:

- **Level 0 (Context)**: System as a single process with external entities
- **Level 1 (Detailed)**: 11 main processes with 12 data stores and complete data flows

---

## 📋 DFD Level 0 - Context Diagram

### Purpose
High-level view of the CRM system boundary, external entities, and system inputs/outputs.

### Components

#### External Entities (2)
| Entity | Type | Role |
|--------|------|------|
| **💼 Sales Executive** | Actor | Internal user: Partner, Marketing Manager, or Admin - manages all business operations |
| **📧 Email Service** | System | External SMTP for password resets, notifications, subscription renewal alerts |

#### Main System
| Component | Description |
|-----------|-------------|
| **🏢 CRM System** | Centralized platform for managing entire lead-to-subscription lifecycle |

#### Data Storage
| Store | Type |
|-------|------|
| **💾 PostgreSQL Database** | Persistent storage for all system data |

#### Data Flows (4)
| Flow | From | To | Data |
|------|------|-----|------|
| 1 | Sales Executive | CRM System | Lead, customer, order, subscription CRUD requests |
| 2 | CRM System | Sales Executive | Business data, analytics, dashboards, exports |
| 3 | CRM System | Email Service | Password reset OTPs, notifications, renewal reminders |
| 4 | CRM System | Database | Read/write all persistent data |

---

## 🔍 DFD Level 1 - Detailed Process Decomposition

### Overall Architecture

The system decomposes into **11 processes** across **12 data stores**, organized by functional domain:

```
Domain 1: Authentication & Security (P1)
Domain 2: Lead Management (P2)
Domain 3: Customer Management (P3)
Domain 4: Order Management (P4)
Domain 5: Subscription Management (P5, P11)
Domain 6: Product Catalog (P6)
Domain 7: Activity & Notification (P7, P8)
Domain 8: Analytics & Reporting (P9, P10)
```

---

### ✅ Processes (11 Total)

#### **P1: Authentication & User Management** 🔐
**Purpose:** Secure login, JWT token generation, OTP-based password resets  
**Controllers:** AuthController, UsersController  
**Services:** JwtHelper, OtpService  
**Key Operations:**
- User login with email/password
- JWT access token generation
- OTP generation & email delivery
- Password reset validation
- User role management (Partner, Marketing, ManagementAdmin)

**Data Flows:**
- 1.1: User credentials → P1
- 1.2: JWT tokens → Sales Executive
- 1.3/1.4: User CRUD ↔ D1 (Users)
- 1.5: OTP ↔ D11 (PasswordReset/OTP)
- 1.6: Password reset email → Email Service  
- 1.7: Login event → P7 (Activity logging)

---

#### **P2: Lead Management** 📋
**Purpose:** Create, track, update leads through sales pipeline  
**Controllers:** LeadsController  
**Key Operations:**
- Create new leads with company/contact info
- Update lead status (New, Qualified, Demo, Converted, Lost)
- Track lead source, rating, estimated value
- Lead-to-customer conversion
- Add notes and history

**Data Flows:**
- 2.1: Lead CRUD requests → P2
- 2.2: Lead data & status → Sales Executive
- 2.3: Lead CRUD ↔ D2 (Leads)
- 2.4: Lead history updates ↔ D3 (LeadHistory)
- 2.5: Activity events → P7 (Tracking)
- 2.6: Dashboard queries → P9 (Read-only)

**Role-Based Access:** Partners see only their own leads

---

#### **P3: Customer Management** 👤
**Purpose:** Manage customer profiles and relationships  
**Controllers:** CustomersController  
**Key Operations:**
- Customer profile creation/update
- Billing & shipping addresses
- Customer type classification (Business, Individual)
- Link customers to account owner
- Manage customer-related metadata

**Data Flows:**
- 3.1: Customer CRUD requests → P3
- 3.2: Customer data → Sales Executive
- 3.3: Customer CRUD ↔ D4 (Customers)
- 3.4: Activity events → P7 (Tracking)
- 3.5: Dashboard queries → P9 (Read-only)

---

#### **P4: Order Management** 📦
**Purpose:** Handle order placement, pricing, and lifecycle  
**Controllers:** OrdersController  
**Key Operations:**
- Create orders with selected products
- Order pricing: base price, customization, discount, tax calculation
- Order status tracking (Pending, Confirmed, Delivered)
- Payment status tracking (Pending, Completed, Failed)
- Link orders to subscriptions
- Renewal order support
- Earnings calculation for partners (10% commission)

**Data Flows:**
- 4.1: Order CRUD requests → P4
- 4.2: Order confirmation → Sales Executive
- 4.3: Order CRUD ↔ D6 (Orders)
- 4.4: Create subscription → P5
- 4.5: Activity events → P7 (Tracking)
- 4.6: Dashboard queries → P9 (Read-only)
- 4.7: Event logging → D9 (Activities)

**Note:** No actual payment gateway integration (payment status tracked manually)

---

#### **P5: Subscription Management** 🔄
**Purpose:** Manage subscription lifecycle, renewals, and lifecycle events  
**Controllers:** SubscriptionsController  
**Services:** BackgroundNotificationService  
**Key Operations:**
- Create subscriptions from orders
- Track subscription periods (current & renewal dates)
- Track subscription status (Active, Expired, Suspended, Cancelled)
- Support auto-renewal (on/off)
- Suspend/reactivate subscriptions
- Cancel with reason tracking
- Link to product variants for pricing

**Data Flows:**
- 5.1: Create from order → P5
- 5.2: Manage subscriptions → P5
- 5.3: Subscription data → Sales Executive
- 5.4: Subscription CRUD ↔ D7 (Subscriptions)
- 5.5: Subscription history ↔ D8 (SubscriptionHistory)
- 5.6: Activity events → P7 (Tracking)
- 5.7: Renewal event → P7 (For notifications)
- 5.8: Expiry check (hourly) ← P11 (Background Scheduler)
- 5.9: Expiry alerts → P8 (Notification Service)
- 5.10: Dashboard queries → P9 (Read-only)

**Background Processing:**
- Runs hourly to check subscriptions expiring in 1-30 days
- Sends notifications at 30, 14, 7, 3, 1 day(s) before expiry
- Sends email if ≤7 days to expiry

---

#### **P6: Product Variant Management** 💳
**Purpose:** Manage product catalog and pricing tiers  
**Controllers:** ProductVariantsController  
**Key Operations:**
- View/manage product variants
- Track pricing for single-user and multi-user licenses
- Annual subscription fee configuration
- Product features list (stored as JSON)
- Display order and active status

**Data Flows:**
- 6.1: View products → P6
- 6.2: Product data → Sales Executive
- 6.3: Product CRUD ↔ D5 (ProductVariants)
- 6.4: Price lookup → P4 (Order pricing)

---

#### **P7: Activity & Event Tracking** 🔔
**Purpose:** Log all system events and trigger downstream processes  
**Controllers:** ActivitiesController  
**Key Operations:**
- Log all events from P1, P2, P3, P4, P5 (Auth, Lead, Customer, Order, Subscription)
- Activity details: type, subject, description, date, duration, outcomes
- Activity status & priority
- Assign activities to team members
- Filter by related entity (Lead, Customer, Order, Subscription)
- Audit trail for compliance

**Activity Types Tracked:**
- LeadAssigned, LeadConverted, LeadStatusChange
- CustomerCreated, CustomerUpdated
- OrderCreated, OrderConfirmed, OrderDelivered
- SubscriptionCreated, SubscriptionRenewalDue, SubscriptionCancelled, etc.
- LoginAttempt, PasswordReset, RoleChange

**Data Flows:**
- 7.1: Auth events ← P1
- 7.2: Lead events ← P2
- 7.3: Customer events ← P3
- 7.4: Order events ← P4
- 7.5: Subscription events ← P5
- 7.6: Activity CRUD ↔ D9 (Activities)
- 7.7: Audit logging ↔ D12 (Audit Trail)
- 7.8: Trigger notifications → P8

**Role-Based Access:** Partners see only events related to their own leads/customers/orders

---

#### **P8: Notification Service** 📬
**Purpose:** Deliver notifications via email and in-app  
**Controllers:** NotificationsController  
**Services:** NotificationService, EmailService  
**Key Operations:**
- Receive events from P7 and P5
- Create in-app notifications with priority (Low, Medium, High)
- Send email notifications for critical events
- Track notification delivery status
- Store notification history
- Mark as read/unread

**Notification Triggers:**
- Password Reset OTP emails
- Lead Assignment notifications
- Order Confirmations
- Subscription Renewal Due (30/14/7/3/1 days before)
- Subscription Expiry alerts
- System alerts and task assignments

**Data Flows:**
- 8.1: Event notifications ← P7
- 8.2: Renewal events ← P5 (from P11 background check)
- 8.3: Notification CRUD ↔ D10 (Notifications)
- 8.4: Email dispatch → Email Service
- 8.5: In-app notifications → Sales Executive

---

#### **P9: Dashboard & Reporting** 📊
**Purpose:** Provide business analytics and KPIs  
**Controllers:** DashboardController  
**Key Operations:**
- View real-time dashboard statistics
- Calculate key metrics: lead count, conversion rate, revenue, earnings
- Filter data by user role (Partner sees own data only)
- Calculate 10% commission for partners
- Upcoming renewal tracking (30/90 days)
- Recent activity feed

**Dashboard Metrics (Partner View):**
- Leads: Total, New, Demo, Converted, Lost
- Customers: Total count
- Orders: Total, Pending, Confirmed, Delivered
- Subscriptions: Total, Active, Expired
- Revenue: Total confirmed/delivered orders
- Earnings: 10% commission on revenue
- Renewals: 30-day and 90-day upcoming

**Data Flows:**
- 9.1: Dashboard request → P9
- 9.2: Statistics & metrics → Sales Executive
- 9.3-9.8: Read queries ← D2, D3, D4, D6, D7, D9 (read-only)
- 9.9: Commission calculation using D6

---

#### **P10: Data Export & Reporting** 💾
**Purpose:** Export partner data in portable ZIP format  
**Controllers:** ExportController  
**Key Operations:**
- Export partner data to ZIP file
- Generate CSVs for: leads, customers, orders, subscriptions, products, earnings
- Include manifest and import mapping guide
- Support multiple export presets (generic, custom)

**Export Format:**
- ZIP archive containing:
  - manifest.txt (export metadata)
  - {preset}_leads.csv
  - {preset}_customers.csv
  - {preset}_orders.csv
  - {preset}_subscriptions.csv
  - {preset}_products.csv
  - {preset}_earnings.csv (with 10% commission calculated)
  - {preset}_import_mapping_guide.txt

**Data Flows:**
- 10.1: Export request → P10
- 10.2: ZIP file download → Sales Executive
- 10.3-10.7: Read queries ← D2, D4, D6, D7, D5
- 10.8: CSV generation from D6

---

#### **P11: Background Scheduler** ⏰
**Purpose:** Automated subscription expiry checks  
**Services:** BackgroundNotificationService  
**Key Operations:**
- Runs every 1 hour automatically
- Checks subscriptions expiring in 1-30 days
- Identifies subscriptions reaching expiry milestones  
- Triggers notification creation at specific intervals
- Prevents duplicate notifications

**Expiry Notification Schedule:**
- 30 days before: notify
- 14 days before: notify
- 7 days before: notify (email)
- 3 days before: notify (email)
- 1 day before: notify (email)

**Data Flows:**
- 11.1: Hourly scheduled check → P5
- 11.2: Subscription expiry data ← P5
- 11.3: Trigger notification flow → P8

---

### 💾 Data Stores (12 Total)

| Store | Contents | Access Type | Controllers |
|-------|----------|-------------|-------------|
| **D1: Users** | User profiles, roles, passwords, auth metadata | Read/Write | Auth, Users |
| **D2: Leads** | Lead records, status, ratings, estimates, conversion tracking | Read/Write | Leads, Dashboard, Export |
| **D3: LeadHistory** | Lead status change history, audit trail | Read/Write | Leads, Dashboard |
| **D4: Customers** | Customer profiles, billing addresses, account ownership | Read/Write | Customers, Dashboard, Export |
| **D5: ProductVariants** | Product catalog, pricing tiers (single/multi-user), features | Read/Write | ProductVariants, Orders |
| **D6: Orders** | Order records, pricing breakdown, status, payment tracking | Read/Write | Orders, Dashboard, Export |
| **D7: Subscriptions** | Active subscriptions, renewal dates, auto-renew flags | Read/Write | Subscriptions, Dashboard, Export |
| **D8: SubscriptionHistory** | Subscription lifecycle events and status changes | Read/Write | Subscriptions |
| **D9: Activities** | Activity logs, task assignments, outcomes, dates | Read/Write | Activities, Dashboard |
| **D10: Notifications** | In-app notifications, email status, delivery tracking | Read/Write | Notifications, Activity |
| **D11: PasswordReset/OTP** | OTP tokens, validity timestamps, used status | Read/Write | Auth (P1) |
| **D12: Audit Trail** | System audit logs for compliance and debugging | Write/Read | Activity (P7) |

---

### 🔀 Key Data Flows Summary

#### Flow Pattern: Read/Write (↔)
Direct data persistence - create, read, update operations
```
Example: P2 ↔ D2 (Lead CRUD)
```

#### Flow Pattern: Read-Only (⇢)
Dashboard and reporting queries - no modifications
```
Example: P9 ⇢ D2 (Dashboard reads leads)
```

#### Flow Pattern: Write-Only (→)
One-directional data capture
```
Example: P7 → D9 (Activity logging)
```

---

### 🔐 Role-Based Access Control

**Three User Roles with Different Permissions:**

| Role | Access Level | Can See |
|------|--------------|---------|
| **Partner** | Limited | Only their own leads, customers, orders, subscriptions, activities |
| **Marketing** | Full | All leads, customers, dashboards, but own orders |
| **ManagementAdmin** | Full | All data, user management, system configuration |

**Implementation:** Role-based filtering in every endpoint (P1/P2/P3/P4/P5)

---

### 🔗 Critical Workflows

#### Workflow 1: Lead-to-Customer-to-Order
```
Sales Executive
    ↓
P2 (Create Lead) → D2
    ↓ (Conversions logged)
P7 (Activity)  → D9
    ↓ (When qualified)
P3 (Create Customer) → D4
    ↓ (When customer ready to buy)
P4 (Create Order) → D6
    ↓ (Activity logged)
P7 (Activity) → D9
```

#### Workflow 2: Order-to-Subscription-to-Renewal
```
P4 (Order Confirmed) → D6
    ↓ (New subscription created)
P5 (Create Subscription) → D7
    ↓ (History tracked)
P5 (Sub History) → D8
    ↓ (Every hour)
P11 (Scheduler checks expiry)
    ↓ (If expiring in 1-30 days)
P8 (Send notification)
    ↓ (Email + in-app)
Sales Executive (Receives alert)
```

#### Workflow 3: Partner Analytics
```
Sales Executive (Dashboard request)
    ↓
P9 (Dashboard) → Reads all data stores
    ↓ (Calculate commission: 10%)
P9 (Query D6 for orders)
    ↓ (Filter by status & date)
P9 (10% of confirmed revenue)
    ↓
Display earnings to Partner
```

#### Workflow 4: Data Export
```
Sales Executive (Export request)
    ↓
P10 (Export) → Reads D2, D4, D6, D7, D5
    ↓ (Generate CSV files)
P10 (Create ZIP archive)
    ↓ (Include manifest & guide)
Download → Sales Executive
```

---

### 🎨 Color Coding

**Processes (by function):**
- 🟢 Green: Authentication & User Management (P1)
- 🔵 Blue: Lead Management (P2)
- 🟠 Orange: Customer Management (P3)
- 🔴 Pink: Order Management (P4)
- 🟣 Purple: Subscription Management (P5)
- 🟦 Indigo: Product Variant Management (P6)
- 🟥 Red: Activity & Event Tracking (P7)
- 🟦 Teal: Notification Service (P8)
- 🟨 Yellow: Dashboard & Reporting (P9)
- 🟩 Lime: Data Export (P10)
- 🟪 Lavender: Background Scheduler (P11)

**Data Stores:**
- 🟦 Teal with darker borders: All persistent data

**External Entities:**
- 🟢 Green: Sales Executive (Actor)
- 🟩 Light Green: Email Service (System)

---

### 📐 DFD Rules Applied

✅ **External entities only:** No customers shown (they don't use system)  
✅ **No direct P→P flows:** All process communication via data stores or external entities  
✅ **Labeled flows:** All arrows numbered and described (1.1, 2.1, etc.)  
✅ **Balanced decomposition:** Level 0 → Level 1 with clear hierarchy  
✅ **Data store persistence:** All data stored in database, no transient stores  
✅ **Actor participation:** Sales Executive is primary actor, Email Service is external system  

---

### 🔄 API Endpoint to Process Mapping

| Endpoint | Process | Data Flow |
|----------|---------|-----------|
| POST /auth/login | P1 | 1.1, 1.2 |
| POST /auth/forgot-password | P1 | 1.5, 1.6 |
| GET /leads | P2 | 2.1, 2.2, 2.3 |
| POST /leads/{id}/convert | P2, P3 | 2.5 → 3.4 |
| GET /customers | P3 | 3.1, 3.2, 3.3 |
| POST /orders | P4 | 4.1, 4.3, 4.4 |
| PUT /orders/{id}/confirm | P4 | 4.5, 4.7 |
| GET /subscriptions | P5 | 5.2, 5.4 |
| GET /products | P6 | 6.1, 6.2, 6.3 |
| GET /activities | P7 | 7.6 |
| GET /notifications | P8 | 8.3 |
| GET /dashboard/stats | P9 | 9.1, 9.2, 9.3-9.9 |
| GET /export/partner-profile | P10 | 10.1, 10.2 |

---

### 📊 System Metrics & Calculations

**Commission Rate:** 10% on confirmed/delivered orders  
**OTP Validity:** 10 minutes  
**Background Job:** Every 1 hour  
**Subscription Renewal Alerts:** 30, 14, 7, 3, 1 days before expiry  
**Email on Renewal:** Only if ≤7 days to expiry  
**Session Data:** JWT tokens stored in cookies + HttpOnly  

---

### ✨ Key Features Tracked

1. **Multi-User License Types:** Single-user vs Multi-user pricing
2. **Custom Order Fields:** JSON-based custom fields support
3. **Renewal Order Support:** Track renewed vs new orders
4. **Earnings Tracking:** Partner commissions calculated in real-time
5. **Subscription Lifecycle:** Suspended, Cancelled, Expired states
6. **Activity Filtering:** By type, related entity, and date range
7. **Notification Priority:** Low, Medium, High priority levels
8. **Export Presets:** Multiple data export formats available

---

### 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-03-26 | Complete regeneration with 11 processes, 12 stores, all controllers included |
| 1.0 | 2026-03-26 | Initial DFD with simplified 8 processes, removed payment gateway |

