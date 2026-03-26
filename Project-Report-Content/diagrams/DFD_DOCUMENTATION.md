# Data Flow Diagram (DFD) Documentation
## CRM System - Lead & Subscription Management

---

## 📊 Overview

This document describes the Data Flow Diagrams (DFD) for the CRM system, which manages leads, customers, orders, and subscriptions. The DFDs are organized in two levels:

- **Level 0**: Context diagram showing the system as a single process
- **Level 1**: Detailed process diagram showing 8 major subsystems

---

## 📋 DFD Level 0 - Context Diagram

### Purpose
The Level 0 diagram provides a high-level view of the entire CRM system and its interactions with external entities.

### Components

#### External Entities (Actors & Systems)
| Entity | Type | Description |
|--------|------|-------------|
| **💼 Sales Executive** | Actor | Internal user who manages leads, customers, orders, and subscriptions |
| **⚙️ System Administrator** | Actor | Internal user who manages system configuration, users, roles, and permissions |
| **📧 Email Service** | System | External SMTP service for sending notifications and password reset emails |

#### Processes
| Process | Description |
|---------|-------------|
| **🏢 CRM System** | Core system handling all lead management, customer data, orders, and subscriptions |

#### Data Storage
| Store | Description |
|-------|-------------|
| **💾 PostgreSQL Database** | Persistent storage for all system data |

#### Data Flows
| From | To | Data |
|------|-----|------|
| Sales Executive | CRM System | Lead, customer, order, and subscription requests |
| CRM System | Sales Executive | Lead, customer, order, and subscription details; Dashboard metrics |
| Administrator | CRM System | User management, role configuration, system monitoring requests |
| CRM System | Administrator | System status, activity logs, user audit trails |
| CRM System | Email Service | Password reset emails, notifications |
| CRM System | Database | Store/retrieve all system data |

---

## 🔍 DFD Level 1 - Detailed Process Diagram

### Purpose
The Level 1 diagram decomposes the main CRM system into 8 specific processes and shows the detailed data flows between them, data stores, and external entities.

### Processes

#### **P1: Authentication & User Management** 🔐
- **Purpose**: Handle user authentication, role-based authorization, and password management
- **Controllers**: AuthController, UsersController
- **Services**: JwtHelper, OtpService
- **Key Flows**:
  - Login credentials validation
  - JWT token generation
  - User profile management
  - Password reset via OTP
  - User role assignment

#### **P2: Lead Management** 📋
- **Purpose**: Manage lead creation, tracking, status updates, and conversion to customers
- **Controllers**: LeadsController
- **Key Flows**:
  - Create/edit leads
  - Update lead status (New, Qualified, Converted, etc.)
  - Convert leads to customers
  - Maintain lead history and audit trail
  - Trigger notifications for lead events

#### **P3: Customer Management** 👤
- **Purpose**: Manage customer profiles, contact information, and customer-related data
- **Controllers**: CustomersController
- **Key Flows**:
  - Convert qualified leads to customers
  - Maintain customer profiles
  - Link customers to account owners
  - Query customers for dashboard reporting
  - Trigger customer event notifications

#### **P4: Order Management** 📦
- **Purpose**: Handle order creation and confirmation
- **Controllers**: OrdersController
- **Key Flows**:
  - Create orders from customer requests
  - Confirm order placement
  - Update order status
  - Link orders to subscriptions
  - Track order earnings for partners

#### **P5: Subscription Management** 🔄
- **Purpose**: Manage subscription lifecycle including creation, renewal, suspension, and cancellation
- **Controllers**: SubscriptionsController
- **Services**: BackgroundNotificationService
- **Key Flows**:
  - Create subscriptions from orders
  - Manage subscription status (Active, Suspended, Cancelled, Expired)
  - Track renewal dates
  - Manage auto-renewal settings
  - Link to product variants
  - Trigger renewal notifications

#### **P6: Notifications & Activity Tracking** 🔔
- **Purpose**: Log all system activities and send notifications to users
- **Controllers**: NotificationsController, ActivitiesController
- **Services**: NotificationService, EmailService, BackgroundNotificationService
- **Key Flows**:
  - Receive events from all other processes
  - Create activity logs
  - Store and manage notifications
  - Send email notifications
  - Track changes and audit trails

#### **P7: Dashboard & Reporting** 📊
- **Purpose**: Provide analytics, statistics, and business intelligence
- **Controllers**: DashboardController
- **Key Flows**:
  - Query system data for statistics
  - Calculate metrics and KPIs
  - Provide recent activities
  - Dashboard data aggregation

#### **P8: Data Export & Profile Management** 💾
- **Purpose**: Handle data exports and partner profile management
- **Controllers**: ExportController, UsersController
- **Key Flows**:
  - Export partner profiles
  - Generate JSON exports
  - Profile management operations

---

### Data Stores

| Store | Contents | Associated Processes |
|-------|----------|----------------------|
| **D1: Users & Authentication** | User profiles, roles, permissions, credentials | P1, P6, P7, P8 |
| **D2: Leads & Lead History** | Lead records, status history, audit trails | P2, P3, P6, P7 |
| **D3: Customers** | Customer profiles, contact info, billing addresses | P3, P4, P5, P6, P7 |
| **D4: Orders** | Order records, status, payment information | P4, P5, P6, P7 |
| **D5: Subscriptions & History** | Subscription records, renewal dates, history | P5, P6, P7 |
| **D6: Activities** | Activity logs, audit trails, user actions | P6, P7 |
| **D7: Notifications** | Notification records, status, delivery logs | P6, P7 |
| **D8: Product Variants** | Product details, pricing, features | P5 |
| **D9: Password Reset** | OTP tokens, password reset requests | P1 |

---

### Data Flow Reference

#### Authentication Module (1.x)
| Flow ID | Description | Direction |
|---------|-------------|-----------|
| 1.1 | Login credentials | Sales Exec → P1 |
| 1.2 | User management requests | Admin → P1 |
| 1.3 | Auth tokens | P1 → Sales Exec |
| 1.4 | Auth status | P1 → Admin |
| 1.5 | Read/Write user data | P1 ↔ D1 |
| 1.6 | Password reset email | P1 → Email Service |
| 1.7 | Reset tokens | P1 ↔ D9 |

#### Lead Management Module (2.x)
| Flow ID | Description | Direction |
|---------|-------------|-----------|
| 2.1 | Create/Edit lead data | Sales Exec → P2 |
| 2.2 | Lead status & details | P2 → Sales Exec |
| 2.3 | Lead records history | P2 ↔ D2 |
| 2.4 | Lead activity log | P2 → P6 |
| 2.5 | Read leads | P7 ⇢ D2 (read-only) |

#### Customer Management Module (3.x)
| Flow ID | Description | Direction |
|---------|-------------|-----------|
| 3.1 | Customer requests | Sales Exec → P3 |
| 3.2 | Customer details | P3 → Sales Exec |
| 3.3 | Customer records | P3 ↔ D3 |
| 3.4 | Customer activity | P3 → P6 |
| 3.5 | Customer query | P7 ⇢ D3 (read-only) |

#### Order Management Module (4.x)
| Flow ID | Description | Direction |
|---------|-------------|-----------|
| 4.1 | Order placement | Sales Exec → P4 |
| 4.2 | Order confirmation | P4 → Sales Exec |
| 4.3 | Order records | P4 ↔ D4 |
| 4.4 | Order to subscription | P4 → P5 |
| 4.5 | Order activity log | P4 → P6 |
| 4.6 | Read orders | P7 ⇢ D4 (read-only) |

#### Subscription Management Module (5.x)
| Flow ID | Description | Direction |
|---------|-------------|-----------|
| 5.1 | Create subscription | P4 → P5 |
| 5.2 | Manage subscriptions | Sales Exec → P5 |
| 5.3 | Subscription status | P5 → Sales Exec |
| 5.4 | Subscription records | P5 ↔ D5 |
| 5.5 | Product variant data | P5 ↔ D8 |
| 5.6 | Renewal/Expiry notification | P5 → P6 |

#### Notification & Activity Module (6.x)
| Flow ID | Description | Direction |
|---------|-------------|-----------|
| 6.1 | Lead events | P2 → P6 |
| 6.2 | Customer events | P3 → P6 |
| 6.3 | Order events | P4 → P6 |
| 6.4 | Subscription events | P5 → P6 |
| 6.5 | Auth events | P1 → P6 |
| 6.6 | Activity records | P6 ↔ D6 |
| 6.7 | Notification records | P6 ↔ D7 |
| 6.8 | Send notifications | P6 → Email Service |
| 6.9 | In-app notification | P6 → Sales Exec |

#### Dashboard Module (7.x)
| Flow ID | Description | Direction |
|---------|-------------|-----------|
| 7.1 | Dashboard request | Sales Exec → P7 |
| 7.2 | Statistics & metrics | P7 → Sales Exec |
| 7.3 | Read leads | P7 ⇢ D2 (read-only) |
| 7.4 | Read customers | P7 ⇢ D3 (read-only) |
| 7.5 | Read orders | P7 ⇢ D4 (read-only) |
| 7.6 | Read subscriptions | P7 ⇢ D5 (read-only) |
| 7.7 | Read activities | P7 ⇢ D6 (read-only) |

#### Export & Profile Module (8.x)
| Flow ID | Description | Direction |
|---------|-------------|-----------|
| 8.1 | Export profile | Sales Exec → P8 |
| 8.2 | Profile data | P8 → Sales Exec |
| 8.3 | Read user profile | P8 ⇢ D1 (read-only) |

---

## 🔗 Process Interactions

### Lead & Customer Management Workflow
```
Sales Executive
    ↓
P2 (Lead Management) → Create/Update Lead
    ↓
    ↔ D2 (Lead Storage)
    ↓
P3 (Customer Management) → Create/Manage Customer
    ↓
    ↔ D3 (Customer Storage)
    ↓
P6 (Notifications) → Log Activity
    ↓
D6/D7 (Activity & Notification Storage)
```

### Order-to-Subscription Workflow
```
Sales Executive
    ↓
P4 (Order Management) → Create Order
    ↓
    ↔ D4 (Order Storage)
    ↓
P4 → P5 (Create Subscription)
    ↓
P5 (Subscription Management) → Active Subscription
    ↓
    ↔ D5 (Subscription Storage)
    ↓
P6 (Log Activity)
    ↓
D6/D7 (Activity & Notification Storage)
```

### Subscription Renewal Notification Workflow
```
P5 (Background Service Check)
    ↓
Renewal Date Approaching?
    ↓
P5 → P6 (Trigger Renewal Event)
    ↓
P6 → D7 (Store Notification)
    ↓
P6 → Email Service (Send Email)
    ↓
P6 → Sales Exec (In-app Notification)
```

---

## 🎨 Color Coding

### Processes
- **Green (P1)**: Authentication & User Management
- **Blue (P2)**: Lead Management
- **Orange (P3)**: Customer Management
- **Pink (P4)**: Order Management
- **Purple (P5)**: Subscription Management
- **Red (P6)**: Notifications & Activity Tracking
- **Indigo (P7)**: Dashboard & Reporting
- **Teal (P8)**: Data Export & Profile Management

### Data Stores
- **Teal with darker border**: All data stores (read/write operations)

### External Entities
- **Green**: Sales Executive (Actor)
- **Orange**: System Administrator (Actor)
- **Green**: Email Service (System)

---

## 📝 Implementation Notes

### Arrow Types
- **Solid Arrows (→)**: Primary data flows
- **Bidirectional Arrows (↔)**: Read and write operations
- **Dashed Arrows (⇢)**: Read-only queries
- **Dotted Arrows (-.->)**: Optional/conditional flows

### Process Numbering
- Processes are numbered P1-P8
- Data stores are numbered D1-D9
- All flows are numbered within their module (e.g., 1.1, 2.1, etc.)

### Role-Based Access Control
The CRM system has two main user roles:
- **Administrator (ManagementAdmin)**: Full access to all features including user management, system configuration, and all business data
- **Sales Executive (Partner, Marketing)**: Access to leads, customers, orders, and subscriptions with role-based filtering (Partners see only their own data)

---

## 🔒 Security & Authorization

### Authentication Flow (P1)
1. User provides credentials
2. System validates against D1
3. JWT token generated if valid
4. Token sent to client via cookie/response
5. All subsequent requests include token
6. Token validated for authorization

### Password Reset Flow (P1)
1. User requests password reset
2. OTP generated and stored in D9
3. OTP sent via Email Service
4. User provides OTP
5. New password set in D1
6. D9 record invalidated

---

## 📊 Reporting & Analytics (P7)

The Dashboard aggregates data from:
- **Leads**: Total, by status, conversion rate
- **Customers**: Total, by type, growth trending
- **Orders**: Total revenue, pending orders, confirmed orders
- **Subscriptions**: Active subscriptions, renewal rate, churn rate
- **Activities**: Recent actions, user engagement

---

## 🔄 Background Services

### Subscription Renewal Checks
- **Frequency**: Every 1 hour
- **Trigger**: Checks subscriptions expiring in 1-30 days
- **Action**: Sends notifications at 30, 14, 7, 3, 1 day(s) before expiry
- **Details**: Stores notification record, sends email if ≤7 days

### Email Notifications
- Sent for password reset
- Sent for subscription renewals (7 days before)
- Sent for critical business notifications
- Templated HTML emails via SMTP

---

## 🗄️ Database Relationships

```
Users (D1)
├── Leads (D2) via CreatedBy/AssignedTo
├── Customers (D3) via AccountOwner/CreatedBy
├── Orders (D4) via CreatedBy
├── Activities (D6) via CreatedBy
└── Notifications (D7) via UserId

Leads (D2)
├── Customers (D3) via Conversion
└── LeadHistory (implicit in D2)

Customers (D3)
├── Orders (D4) via CustomerId
└── Subscriptions (D5) via CustomerId

Orders (D4)
├── Subscriptions (D5) via OrderId
└── ProductVariants (D8) via VariantId

Subscriptions (D5)
├── ProductVariants (D8) via VariantId
└── SubscriptionHistory (implicit in D5)
```

---

## 📚 API Controllers Mapping

| Process | Controllers | Key Endpoints |
|---------|-------------|---------------|
| P1 | AuthController, UsersController | /api/auth/*, /api/users/* |
| P2 | LeadsController | /api/leads/* |
| P3 | CustomersController | /api/customers/* |
| P4 | OrdersController | /api/orders/* |
| P5 | SubscriptionsController | /api/subscriptions/* |
| P6 | NotificationsController, ActivitiesController | /api/notifications/*, /api/activities/* |
| P7 | DashboardController | /api/dashboard/* |
| P8 | ExportController | /api/export/* |

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-26 | Initial DFD documentation with Level 0 and Level 1 diagrams |

