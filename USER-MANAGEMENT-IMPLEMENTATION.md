# User Management Implementation Guide

## Overview

Complete role-based user management system has been implemented with three distinct user experiences based on their role:
- **ManagementAdmin**: Full user management for all users
- **Marketing**: Partner management (can only see and manage partners they created)
- **Partner**: No user management (only sees their own leads and orders)

## Files Created

### 1. User Management Pages

#### AdminUserManagement.tsx
- **Path**: `src/pages/AdminUserManagement.tsx`
- **Role**: ManagementAdmin only
- **Features**:
  - View all users with their roles and status
  - Create new users (Marketing or Partner roles)
  - Filter users by role and search
  - Enable/Disable user accounts
  - Full CRUD operations

#### MarketingUserManagement.tsx
- **Path**: `src/pages/MarketingUserManagement.tsx`
- **Role**: Marketing only
- **Features**:
  - View only partners they created
  - Create new partners
  - Filter and search partners
  - Enable/Disable partner accounts
  - **Important**: Cannot see ManagementAdmin users

#### PartnerDashboard.tsx
- **Path**: `src/pages/PartnerDashboard.tsx`
- **Role**: Partner only
- **Features**:
  - View personal leads and orders only
  - Statistics about leads and orders
  - Tab-based navigation between leads and orders
  - No user management capabilities

### 2. API Services

#### Updated services/index.ts
Added complete `usersApi` export with endpoints:

```typescript
export const usersApi = {
  getAll(): Promise<User[]>             // Get all users (Admin only via backend)
  getById(id: number): Promise<User>    // Get user by ID
  getCurrentProfile(): Promise<User>    // Get current user profile
  createMarketing(userData): Promise<User>    // Create marketing user
  createPartner(userId, partnerData): Promise<User>  // Create partner under marketing user
  disable(id: number): Promise<string>  // Disable user
  enable(id: number): Promise<string>   // Enable user
}
```

### 3. Routing Setup

#### Updated App.tsx
- Added imports for all three user management pages
- Created `RoleBasedRoute` component for protecting routes by role
- Created `UserManagementWrapper` component for conditional rendering
- Added `/users` route that shows different pages based on user role

#### Updated Sidebar.tsx
- Created role-specific navigation arrays:
  - `fullNavigation`: All items for ManagementAdmin
  - `marketingNavigation`: All items for Marketing users
  - `partnerNavigation`: Limited items for Partners
- Implemented `getNavigationItems()` function that returns appropriate navigation based on role

## Features by Role

### ManagementAdmin
- Access to all system features
- Complete user management:
  - View all users (ManagementAdmin, Marketing, Partner)
  - Create new Marketing users or Partners
  - Filter by role (All, Marketing, Partner, ManagementAdmin)
  - Enable/disable any user account
  - Search users by name or email
- Full access to leads, customers, orders, subscriptions, products
- Notifications and account settings

### Marketing
- Limited user management (Partner management only):
  - View partners they created
  - Create new partners
  - Enable/disable partners
  - Search and filter partners
  - **Cannot see ManagementAdmin users in any list**
- Full access to leads, customers, orders, subscriptions, products
- Notifications and account settings
- Label: "My Partners" instead of "User Management"

### Partner
- **No user management access**
- **Limited data visibility**:
  - Can only see their own leads
  - Can only see their own orders
  - Dashboard shows personal statistics only
- Navigation includes only:
  - My Dashboard
  - My Leads
  - My Orders
  - Account

## Data Types and Naming Conventions

### User Interface
```typescript
export interface User {
  userId: number;                           // Primary key
  name: string;
  email: string;
  role: 'ManagementAdmin' | 'Marketing' | 'Partner';
  phone?: string;
  profileImage?: string;
  isActive: boolean;                        // Note: true = active, false = disabled
  lastLogin?: string;
  createdAt: string;
}
```

### Key Implementation Details
- User ID property is `userId` (not `id`)
- Active status is `isActive: boolean` (not `isDisabled`)
- Role filtering checks string values directly
- Parent-child relationship: Marketing users can create Partners

## API Security Notes

The backend enforces role-based access control:
- `GetAllUsers` endpoint: Requires ManagementAdmin role
- `CreateMarketing` endpoint: Requires ManagementAdmin role
- `CreatePartner` endpoint: Marketing users can only create under themselves
- This ensures Frontend role checks are backed by Backend authorization

## Implementation Highlights

### 1. Type Safety
- Proper TypeScript types for all components
- User interface properties match backend API responses
- Enum mappings for status conversions

### 2. State Management
- React Query for API data fetching and caching
- Mutations for create, enable, disable operations
- Automatic refetch after mutations

### 3. User Experience
- Modal forms for creating users/partners
- Search and filter functionality
- Status indicators (Active/Disabled)
- Role-based role badges with color coding
- Loading states and error handling

### 4. Security
- Route protection with RoleBasedRoute component
- Fallback navigation for unauthorized access
- Backend-enforced authorization on API endpoints
- User role from JWT token in authentication store

## Navigation Structure

```
/users (Role-based routing)
├── ManagementAdmin → AdminUserManagement page
└── Marketing → MarketingUserManagement page

/ (Root)
├── ManagementAdmin → DashboardPage + Full navigation
├── Marketing → DashboardPage + Limited navigation
└── Partner → DashboardPage + Minimal navigation
   └── Links to: My Dashboard, My Leads, My Orders, Account
```

## Testing the Implementation

### For ManagementAdmin
1. Log in as ManagementAdmin
2. Click "User Management" in sidebar
3. Should see all users with filters
4. Can create Marketing or Partner users
5. Can enable/disable any user

### For Marketing
1. Log in as Marketing user
2. Click "My Partners" in sidebar
3. Should see only partners they created
4. Cannot see ManagementAdmin users
5. Can create and manage their partners

### For Partner
1. Log in as Partner
2. Dashboard shows personal statistics
3. "My Leads" tab shows only their leads
4. "My Orders" tab shows only their orders
5. No user management option in navigation

## Backend Integration

The implementation assumes the following backend endpoints exist:
- `GET /users` - Returns all users (ManagementAdmin only)
- `GET /users/{id}` - Get user details
- `GET /users/profile` - Current user profile
- `POST /users/create-marketing` - Create marketing user
- `POST /users/{userId}/create-partner` - Create partner under a marketing user
- `PUT /users/{id}/disable` - Disable user account
- `PUT /users/{id}/enable` - Enable user account

All endpoints have backend role authorization checks to prevent unauthorized access.

## Future Enhancements

Potential features for future development:
- User profile editing capability
- Password reset functionality
- User role change capability
- Activity logs for user actions
- Batch user operations
- Advanced user analytics
- Custom user properties/metadata
- Permission-based feature access (sub-roles)

## Summary

The user management system provides:
✅ Complete CRUD operations for ManagementAdmin
✅ Partner management for Marketing users
✅ No user management for Partners
✅ Role-based navigation and routing
✅ Type-safe implementation
✅ Proper error handling
✅ Search and filter capabilities
✅ Enable/Disable user accounts
✅ Backend authorization integration
✅ Responsive UI with Tailwind CSS
