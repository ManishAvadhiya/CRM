# Technical Reference: Orders & Subscriptions Implementation

## Code Structure

### 1. Enum Mappings (`src/lib/enum-mappings.ts`)

```typescript
// Enum Definitions
export const OrderStatusEnum = {
  Draft: 0,
  Pending: 1,
  Confirmed: 2,
  Delivered: 3,
  Cancelled: 4,
} as const;

export const UserLicenseTypeEnum = {
  SingleUser: 0,
  MultiUser: 1,
} as const;

// Status Maps (number → string)
export const OrderStatusMap: Record<number, string> = {
  0: 'Draft',
  1: 'Pending',
  2: 'Confirmed',
  3: 'Delivered',
  4: 'Cancelled',
};

// Conversion Functions
export function toBackendEnum<T extends Record<string, number>>(
  value: string | number,
  enumMap: T
): number

export function toFrontendEnum(
  value: number | string,
  statusMap: Record<number, string>
): string

// Convenience Functions
export const getOrderStatusString = (status: number | string): string
export const getUserLicenseTypeString = (type: number | string): string
export const getSubscriptionStatusString = (status: number | string): string
export const getPaymentStatusString = (status: number | string): string
```

### 2. Type Definitions (`src/types/index.ts`)

```typescript
export type OrderStatus = 'Draft' | 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Partial' | 'Paid';
export type UserLicenseType = 'SingleUser' | 'MultiUser';

export interface Order {
  orderId: number;
  orderNumber: string;
  customerId: number;
  variantId: number;
  userLicenseType: UserLicenseType | number;  // ✨ Accepts both
  quantity: number;
  basePrice: number;
  baseAmount: number;
  customizationDetails?: string;
  customizationAmount: number;
  discountPercent: number;
  discountAmount: number;
  subTotal: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: OrderStatus | number;  // ✨ Accepts both
  paymentStatus: PaymentStatus | number;  // ✨ Accepts both
  paymentTerms?: string;
  notes?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  productVariant?: ProductVariant;
  subscription?: Subscription;
}
```

### 3. OrdersPage Component (`src/pages/OrdersPage.tsx`)

#### Key Functions

```typescript
// Create order from form
const handleCreate = () => {
  const userLicenseType = (formData.userLicenseType || 'SingleUser') as 'SingleUser' | 'MultiUser';
  const licenseTypeEnum = UserLicenseTypeEnum[userLicenseType];  // Converts: 'SingleUser' → 0
  
  const orderData = {
    customerId: Number(formData.customerId),
    variantId: Number(formData.variantId),
    userLicenseType: licenseTypeEnum,  // Send as number to API
    quantity: Number(formData.quantity) || 1,
    // ... pricing calculations ...
  };
  
  createMutation.mutate(orderData);
};

// Confirm order and create subscription
const handleConfirm = (id: number) => {
  if (confirm('Confirm this order? This will create a subscription automatically.')) {
    confirmMutation.mutate(id);
  }
};

// Display order status badge
const getStatusBadge = (status: number | string) => {
  const statusText = getOrderStatusString(status);  // Converts: 0 → 'Draft', 1 → 'Pending', etc.
  switch (statusText) {
    case 'Delivered':
      return <Badge>Delivered</Badge>;
    case 'Confirmed':
      return <Badge>Confirmed</Badge>;
    // ... other cases ...
  }
};

// Filter orders by search term
const filteredOrders = useMemo(() => {
  if (!orders) return [];
  let filtered = orders;
  
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter(order => 
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order.customer?.companyName?.toLowerCase().includes(searchLower) ||
      order.productVariant?.variantName?.toLowerCase().includes(searchLower)
    );
  }
  
  return filtered;
}, [orders, searchTerm]);
```

#### New Create Subscription Button

```typescript
// In the Orders table Actions column
{getOrderStatusString(order.status || 0) !== 'Confirmed' && 
 getOrderStatusString(order.status || 0) !== 'Delivered' && 
 getOrderStatusString(order.status || 0) !== 'Cancelled' && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => {
      if (confirm('Create subscription for this order? This will also confirm the order.')) {
        confirmMutation.mutate(order.orderId);
      }
    }}
    className="hover:bg-green-100 hover:text-green-600"
    title="Create Subscription"
    disabled={confirmMutation.isPending}
  >
    <CheckCircle className="h-4 w-4" />
  </Button>
)}
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│           USER CREATES ORDER                             │
│  (Form: Customer, Product, License Type, Quantity)      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────────┐
        │ handleCreate()          │
        │ 1. Get form data        │
        │ 2. Convert License      │
        │    Type 'SingleUser'→0  │
        │ 3. Calculate amounts    │
        └──────────┬──────────────┘
                   │
                   ▼
        ┌─────────────────────────┐
        │ POST /api/orders        │
        │ (with form data)        │
        └──────────┬──────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │ ORDER CREATED (API Response)     │
    │ {status: 1, ...}                 │
    │ (number from backend)            │
    └───┬──────────────────────────────┘
        │
        ▼
    ┌──────────────────────────────────┐
    │ Render Order in Table            │
    │ getOrderStatusString(1)          │
    │ → 'Pending'  ✓ Status displayed  │
    └───────────────────────────────────┘
        │
        │  User clicks green ✓ button
        ▼
    ┌──────────────────────────────────┐
    │ handleConfirm(orderId)           │
    │ Show confirmation dialog         │
    │ User confirms                    │
    └───┬──────────────────────────────┘
        │
        ▼
    ┌──────────────────────────────────┐
    │ confirmMutation.mutate(id)       │
    │ PUT /api/orders/{id}/confirm     │
    └───┬──────────────────────────────┘
        │
        ▼
    ┌──────────────────────────────────┐
    │ ORDER CONFIRMED & SUBSCRIPTION   │
    │ CREATED (API Response)           │
    │ {subscriptionId: 1, ...}         │
    │ Order status: 2 (Confirmed)      │
    └───────────────────────────────────┘
        │
        ├─→ Invalidate orders query
        ├─→ Invalidate subscriptions query
        └─→ Update UI

    ▼
    ┌──────────────────────────────────┐
    │ ORDERS PAGE UPDATED              │
    │ • Order status → ✓ Confirmed     │
    │ • Green button hidden            │
    │ • Eye button still available     │
    │                                  │
    │ SUBSCRIPTIONS PAGE UPDATED       │
    │ • New subscription appears       │
    │ • Status: Active                 │
    │ • Renewal: 1 year from today     │
    └──────────────────────────────────┘
```

## API Endpoints

### Create Order
```
POST /api/orders

Request:
{
  customerId: number,
  variantId: number,
  userLicenseType: 0 | 1,  // ← Backend enum
  quantity: number,
  baseAmount: number,
  customizationAmount: number,
  discountPercent: number,
  discountAmount: number,
  subTotal: number,
  taxPercent: number,
  taxAmount: number,
  totalAmount: number,
  notes?: string
}

Response:
{
  success: true,
  message: "Order created successfully",
  data: {
    orderId: number,
    orderNumber: string,
    customerId: number,
    status: 1,  // ← Backend returns as number
    userLicenseType: 0,  // ← Backend returns as number
    // ... All order fields
  }
}
```

### Confirm Order & Create Subscription
```
PUT /api/orders/{id}/confirm

Request: (empty body)

Response:
{
  success: true,
  message: "Order confirmed and subscription created successfully",
  data: {
    subscriptionId: number,
    subscriptionNumber: string,
    customerId: number,
    orderId: number,
    variantId: number,
    status: 0,  // Active
    annualFee: number,
    // ... All subscription fields
  }
}

Side Effects:
• Order status updated to Confirmed (2)
• Subscription created and linked
• Notifications sent to account owner
• Email sent to account owner
```

## Enum Conversion Examples

```typescript
// Creating Order
formData.userLicenseType = 'SingleUser'  // Frontend string
↓
UserLicenseTypeEnum['SingleUser'] = 0  // Convert to backend number
↓
API receives: {userLicenseType: 0}
↓
API returns: {status: 1, userLicenseType: 0}  // As numbers

// Displaying in UI
API response: {status: 1}  // Number from backend
↓
getOrderStatusString(1)  // Convert to string
↓
Returns: 'Pending'
↓
Render: <span>Pending</span>

// Display License Type
order.userLicenseType = 0  // From API
↓
getUserLicenseTypeString(0)
↓
Returns: 'SingleUser'
↓
Render: <p>SingleUser User</p>
```

## Key Points to Remember

1. **Backend returns numbers** - All enum fields come as integers
2. **Frontend uses strings** - UI, state, and logic use string literals
3. **Conversion happens at boundaries** - When sending/receiving from API
4. **Type system allows both** - `status: OrderStatus | number` allows flexibility
5. **Centralized mappings** - All conversions use the same utility functions
6. **No breaking changes** - Backward compatible with existing code

## Debugging Tips

```typescript
// If you see enum mismatch error:
// Error: Type '0' is not assignable to type 'OrderStatus'
// Solution: Use getOrderStatusString(0) or update type to accept number

// If subscription not appearing:
// Check: Did confirmMutation succeed? Check browser console
// Check: Are subscriptions query being invalidated?
// Check: Is subscriptions page making API call?

// If conversion not working:
// Check: Is the utility function imported?
// Check: Are you passing the right type (number or string)?
// Check: Does the mapping exist in enum-mappings.ts?
```

---

**Last Updated:** March 12, 2026  
**Component Status:** ✅ Production Ready  
**Type Safety:** ✅ Full TypeScript  
**Test Coverage:** Ready for QA
