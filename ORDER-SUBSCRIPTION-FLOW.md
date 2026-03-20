# Order & Subscription Creation Flow

## 📋 Order Creation ➜ Subscription Creation ➜ Subscription Page

### Step 1: Create Order
- Navigate to **Orders Page**
- Click **"New Order"** button
- Fill in required fields:
  - Select Customer
  - Select Product Variant
  - Choose License Type (SingleUser/MultiUser)
  - Select Quantity
  - Add customization, discount, tax details
- Click **"Create Order"**
- Order is created with **Draft** or **Pending** status

### Step 2: Create Subscription (Two Methods)

#### Method A: From Orders Table (NEW)
1. Look at the newly created order in the table
2. Click the **green checkmark button** (✓) in the Actions column
3. Confirm the prompt: "Create subscription for this order?"
4. System will:
   - Confirm the order (status → **Confirmed**)
   - Create subscription automatically
   - Show confirmation message
   - Update the subscriptions list

#### Method B: From Order Details
1. Click the **eye icon** (👁️) to view order details
2. Scroll down to see the full order summary
3. Click **"Confirm Order & Create Subscription"** button
4. Same process as Method A

### Step 3: View Subscription
1. Navigate to **Subscriptions Page**
2. Your new subscription appears in the list
3. View subscription details:
   - Subscription Number (auto-generated SUB-YYYY-####)
   - Status: **Active**
   - Annual Fee
   - Start Date & Renewal Date (1 year later)
   - Auto-Renewal: Enabled
   - Associated Customer & Order info

## 🔄 Data Flow

```
Create Order (Draft/Pending)
    ↓
    ├─→ [Orders Table]
    │   └─→ Green Checkmark Action (Create Subscription)
    │       ↓
    │       Order Status: Pending → Confirmed
    │       ↓
    │       Create Subscription (Active)
    │       ↓
    │       → [Auto shown in Subscriptions Page]
    │
    └─→ [Order Details Modal]
        └─→ Confirm & Create Subscription Button
            ↓ (same as above)
```

## ✨ Key Features

### Enum Consistency
- **Frontend** stores: `UserLicenseType = 'SingleUser' | 'MultiUser'`
- **API sends/receives**: `0` (SingleUser) | `1` (MultiUser)
- **Automatic conversion** via `enum-mappings` utility

### Order Statuses
- **Draft** (0) - Initial state
- **Pending** (1) - Default for new orders
- **Confirmed** (2) - ✓ Ready for subscription
- **Delivered** (3) - Completed
- **Cancelled** (4) - Abandoned

### Subscription Auto-Creation
When you confirm an order:
1. ✓ Order status → Confirmed
2. ✓ Subscription created with:
   - Status: **Active**
   - Start Date: Today
   - Renewal Date: 1 year from today
   - Annual Fee: From product variant
   - Auto Renewal: Enabled

3. ✓ Notifications sent to account owner
4. ✓ Both orders & subscriptions queries auto-refresh

## 💡 Type Safety Improvements

All enum conversions are centralized in `src/lib/enum-mappings.ts`:

```typescript
// Sending to API (string → number)
const orderData = {
  userLicenseType: UserLicenseTypeEnum[formData.userLicenseType],
  // = UserLicenseTypeEnum['SingleUser'] = 0
};

// Receiving from API (number → string)
const statusString = getOrderStatusString(order.status);
// = getOrderStatusString(1) = 'Pending'

// Display in UI (proper formatting)
<p>{getUserLicenseTypeString(order.userLicenseType)} User</p>
// = displays "SingleUser User" or "MultiUser User"
```

## 🐛 Bugs Fixed

1. ✓ Enum mismatch (backend sends integers, frontend expected strings)
2. ✓ Hardcoded enum value conversions (0 == SingleUser checks)
3. ✓ Type inconsistency in Order interface
4. ✓ No way to create subscriptions from orders table
5. ✓ No centralized enum conversion utility

## 📝 Files Modified

1. **Created:**
   - `src/lib/enum-mappings.ts` - Enum conversion utilities

2. **Updated:**
   - `src/types/index.ts` - Order interface to accept number | string
   - `src/pages/OrdersPage.tsx` - Use enum utilities and add Create Subscription button

3. **No changes needed:**
   - Backend API (already correctly implements subscriptions)
   - Subscriptions page (queries subscriptions API)
