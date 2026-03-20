# Fixes & Project Role Summary

## ✅ Fixed: Subscription Status Shows as "Unknown"

### Problem
Subscription status was displaying as "Unknown" or showing raw numbers because the API returns status as integers (0, 1, 2, etc.) but the frontend wasn't converting them to readable strings.

### Solution
Updated `SubscriptionsPage.tsx` to use the enum conversion utility:

**Changes:**
1. ✅ Added import: `import { getSubscriptionStatusString } from '@/lib/enum-mappings';`
2. ✅ Updated `getStatusColor()` function to accept both number | string
3. ✅ Fixed table display: `{getSubscriptionStatusString(sub.status || 0)}`
4. ✅ Fixed detail modal display: `{getSubscriptionStatusString(selectedSubscription.status || 0)}`
5. ✅ Updated stats calculation to use proper conversion
6. ✅ Updated Subscription type to accept `status: SubscriptionStatus | number`

### Subscription Status Mapping
```typescript
Active: 0
Expired: 1
Cancelled: 2
Suspended: 3
PendingRenewal: 4
```

### How It Works Now
```
API Response:  {status: 0}  (integer)
↓
Conversion:    getSubscriptionStatusString(0)
↓
Display:       "Active"  (readable string with proper color)
```

---

## 🔐 Project Roles (3 Total)

Your CRM project has **3 role types**:

### 1. **ManagementAdmin**
   - **Permissions:**
     - Can create, read, update, delete users
     - Can manage all users
     - Can assign roles
     - Can view all reports
     - Can access admin functions
   
   - **Usage:**
     - Users controller: Can create/update/delete users
     - Default admin user in seed data
     - Full system access

### 2. **Marketing**
   - **Permissions:**
     - Can create and manage leads
     - Can convert leads to customers
     - Can update lead status
     - Can assign leads
     - Can view assigned items
   
   - **Usage:**
     - Lead management and conversion
     - Limited to marketing-specific operations
     - Can work with leads and customer info

### 3. **Partner**
   - **Permissions:**
     - Can view information
     - Limited read-only access
     - Restricted from creating/deleting
     - Can view associated data
   
   - **Usage:**
     - External partner access
     - Restricted operations
     - Limited visibility

---

## 📍 Where Roles Are Defined

### Backend Definition
**File:** `CRM.API/Models/User.cs`
```csharp
public enum UserRole
{
    ManagementAdmin,  // 0
    Marketing,        // 1
    Partner           // 2
}
```

### Frontend Definition
**File:** `CRM-Frontend-Foundation/src/types/index.ts`
```typescript
export interface User {
  role: 'ManagementAdmin' | 'Marketing' | 'Partner';
  // ... other properties
}
```

---

## 🔑 Role Usage in Code

### Authorization Attributes (Backend)
```csharp
// Only ManagementAdmin can access
[Authorize(Roles = "ManagementAdmin")]
public ActionResult CreateUser() { }

// ManagementAdmin or Marketing
[Authorize(Roles = "Marketing,ManagementAdmin")]
public ActionResult ConvertLead() { }
```

### Role Checks (Frontend)
```typescript
// Check user role
const canEdit = user?.role === 'ManagementAdmin' || lead?.createdBy === user?.userId;

// Check in component/feature
if (user?.role !== 'ManagementAdmin') {
  // Restrict feature
}
```

---

## 📊 Role Comparison Table

| Feature | ManagementAdmin | Marketing | Partner |
|---------|-----------------|-----------|---------|
| Create Users | ✅ | ❌ | ❌ |
| Update Users | ✅ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ |
| Create Leads | ✅ | ✅ | ❌ |
| Convert Leads | ✅ | ✅ | ❌ |
| Update Lead Status | ✅ | ✅ | ❌ |
| View All Data | ✅ | ✅ | ❌ |
| View Own Data | ✅ | ✅ | ✅ |
| Create Orders | ✅ | ✅ | ❌ |

---

## 🧑‍💻 Roles in Different Contexts

### During Login
The role is returned in login response and stored in token
```typescript
interface LoginResponse {
  userId: number;
  name: string;
  email: string;
  role: string;  // 'ManagementAdmin' | 'Marketing' | 'Partner'
  token: string;
}
```

### In API Calls
Role is extracted from JWT token and used for authorization
```csharp
var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
if (userRole != "Marketing" && userRole != "ManagementAdmin" && userRole != "Partner")
{
    return Unauthorized();
}
```

### In UI Components
Role determines what features are visible
```typescript
{user?.role === 'ManagementAdmin' && (
  <AdminPanel />
)}
{user?.role === 'Marketing' && (
  <LeadManagement />
)}
```

---

## 📝 Adding New Roles (Future Reference)

If you need to add a new role in the future:

1. **Backend:** Add to `CRM.API/Models/User.cs`
   ```csharp
   public enum UserRole
   {
       ManagementAdmin,
       Marketing,
       Partner,
       Sales  // ← New role
   }
   ```

2. **Frontend:** Update `CRM-Frontend-Foundation/src/types/index.ts`
   ```typescript
   role: 'ManagementAdmin' | 'Marketing' | 'Partner' | 'Sales';
   ```

3. **Authorization:** Add to relevant controllers
   ```csharp
   [Authorize(Roles = "Sales,ManagementAdmin")]
   public ActionResult SalesFeature() { }
   ```

---

## ✅ Verification

**Status:** ✅ All fixes applied successfully
- ✅ SubscriptionsPage compiles without errors
- ✅ Subscription status displays correctly
- ✅ Enum conversions working
- ✅ Type safety maintained

**Build:** ✅ Clean (no SubscriptionsPage errors)
