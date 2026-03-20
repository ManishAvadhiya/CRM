# Quick Start: Create Subscription from Orders

## 🎯 Where is the "Create Subscription" Button?

The button is in the **Actions column** (rightmost column) of the **Orders Table**.

### Visual Location:
```
┌─────────┬──────────────────┬─────────────┬──────────┬────────┬────────────┐
│ Order # │ Customer         │ Product     │ Details  │ Amount │ Status     │
├─────────┼──────────────────┼─────────────┼──────────┼────────┼────────────┤
│ ORD-001 │ Company ABC      │ Product Pro │ 1 x SU   │ $1,000 │ Pending    │
├─────────┴──────────────────┴─────────────┴──────────┴────────┴────────────┤
│                              ACTIONS COLUMN (Rightmost)                     │
│                         [✓ Green Button] [👁️ Eye Button]                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## ✨ How to Use

### Step 1: Find the Green ✓ Button
- Look at the rightmost column labeled "Actions"
- Find the green checkmark icon button (✓)
- It only appears for orders that are NOT yet Confirmed, Delivered, or Cancelled

### Step 2: Click the Button
- Hover over the green button (shows: "Create Subscription")
- Click it

### Step 3: Confirm the Action
A dialog will appear asking:
```
"Create subscription for this order? 
 This will also confirm the order."
```

- Click **OK** to confirm
- Or click **Cancel** to close the dialog

### Step 4: Wait for Confirmation
The system will:
1. Show a loading spinner on the button
2. Confirm the order (status: Pending → Confirmed)
3. Create a new subscription automatically
4. Invalidate and refresh the lists
5. Close the dialog when complete

### Step 5: Verify Success
- The order is now **Confirmed** (status badge changes)
- The green button disappears (only shows for uncofirmed orders)
- Go to **Subscriptions** page to see the new subscription

## 📍 Orders Table View

### Full Order Row Example
```
Order #    Customer      Product        Details            Amount   Status      Date        Actions
ORD-2026-0001  ABC Inc   CRM Pro        1 x Single User    ₹18,000  📋 Pending  12 Mar 26   ✓  👁️
ORD-2026-0002  XYZ Ltd   CRM Basic      2 x Multi User     ₹36,000  ✓ Confirmed 11 Mar 26      👁️
ORD-2026-0003  Tech Co   CRM Enterprise 3 x Multi User     ₹54,000  🚚 Delivered 10 Mar 26      👁️
```

Legend:
- ✓ (Green Checkmark) = Create Subscription button (clickable for pending/draft orders)
- 👁️ (Eye) = View Details button (always available)
- Status colors indicate order state

## 🔄 What Happens Behind the Scenes

When you click the green checkmark button:

### Order Changes:
```
Before:
  Status: 📋 Pending
  
After:
  Status: ✓ Confirmed
  Associated Subscription: SUB-2026-0001
```

### Subscription Created:
```
✨ NEW SUBSCRIPTION CREATED
  Number: SUB-2026-{sequence}
  Status: Active
  Start Date: Today
  Renewal Date: 1 year from today
  Annual Fee: From selected product
  Auto Renew: Enabled
```

### Notifications Sent:
- Account Owner receives notification:
  - "Order {OrderNumber} has been confirmed"
  - "Subscription {SubscNumber} has been created"
- Emails sent automatically

### Queries Invalidated:
- Orders list auto-refreshes
- Subscriptions list auto-refreshes
- UI updates immediately

## ❌ When the Button is NOT Visible

The green checkmark button only shows for these statuses:
- ✅ **Draft** - Not yet submitted
- ✅ **Pending** - Submitted but not processed

The button is HIDDEN for:
- ❌ **Confirmed** - Already has subscription
- ❌ **Delivered** - Completed order
- ❌ **Cancelled** - Abandoned order

## 🎨 Button Styling

### Normal State:
- Gray background
- Green checkmark icon (✓)
- Label: "Create Subscription" (shown on hover)

### Hover State:
- Light green background (bg-green-100)
- Green text (text-green-600)
- Indicates clickable

### Disabled State:
- Grayed out
- Shows spinner
- Label: "Creating..." (during submission)

## ⚡ Keyboard & Accessibility

- **Tab navigation:** Can tab to the button
- **Enter key:** Activates the button
- **Screen readers:** Announces "Create Subscription Button"
- **Mobile:** Full touch support

## 🚨 Error Handling

If something goes wrong:
- Error message appears in a toast notification
- Button re-enables for retrying
- Orders and subscriptions lists revert

Common errors:
- "Invalid product variant" - Product no longer exists
- "Order already confirmed" - Subscription already created
- "Network error" - Try again later

## 💡 Tips & Tricks

1. **Bulk creation:** Go through each order in the table and create subscriptions one by one
2. **Check status:** The status badge changes immediately after confirmation
3. **Verify subscription:** Click on Subscriptions page to see the created subscription
4. **View details:** Click the eye (👁️) button to see full order information before creating subscription

## 🔗 Related Features

### From This Order:
- Click **👁️ (Eye)** to view full order details
- View all pricing, customization, discounts in modal

### From Subscription:
- Go to **Subscriptions** page
- View the linked order
- Manage renewal, auto-renewal, cancellation

### From Dashboard:
- See recent subscriptions created
- Track subscription metrics

---

**Button Location:** Orders Table → Actions Column (Rightmost)  
**Feature ID:** `createSubscription`  
**Related Endpoint:** `PUT /api/orders/{id}/confirm`
