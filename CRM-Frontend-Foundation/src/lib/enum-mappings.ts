/**
 * Enum Mappings
 * Maps between backend integer enums and frontend string types
 */

export const OrderStatusEnum = {
  Draft: 0,
  Pending: 1,
  Confirmed: 2,
  Cancelled: 3,
  PaymentReceived: 4,
} as const;

export const OrderStatusMap: Record<number, string> = {
  0: 'Draft',
  1: 'Pending',
  2: 'Confirmed',
  3: 'Cancelled',
  4: 'PaymentReceived',
};

export const UserLicenseTypeEnum = {
  SingleUser: 0,
  MultiUser: 1,
} as const;

export const UserLicenseTypeMap: Record<number, string> = {
  0: 'SingleUser',
  1: 'MultiUser',
};

export const SubscriptionStatusEnum = {
  Active: 0,
  Expired: 1,
  Cancelled: 2,
  Suspended: 3,
  PendingRenewal: 4,
} as const;

export const SubscriptionStatusMap: Record<number, string> = {
  0: 'Active',
  1: 'Expired',
  2: 'Cancelled',
  3: 'Suspended',
  4: 'PendingRenewal',
};

export const PaymentStatusEnum = {
  Pending: 0,
  Partial: 1,
  Paid: 2,
} as const;

export const PaymentStatusMap: Record<number, string> = {
  0: 'Pending',
  1: 'Partial',
  2: 'Paid',
};

export const OrderTypeEnum = {
  New: 0,
  Renew: 1,
} as const;

export const OrderTypeMap: Record<number, string> = {
  0: 'New',
  1: 'Renew',
};

export const SubscriptionChangeTypeEnum = {
  Created: 0,
  Renewed: 1,
  Cancelled: 2,
  Suspended: 3,
  Reactivated: 4,
  Expired: 5,
  VariantChanged: 6,
  Other: 7,
} as const;

export const SubscriptionChangeTypeMap: Record<number, string> = {
  0: 'Created',
  1: 'Renewed',
  2: 'Cancelled',
  3: 'Suspended',
  4: 'Reactivated',
  5: 'Expired',
  6: 'VariantChanged',
  7: 'Other',
};

/**
 * Convert frontend string enum to backend integer
 */
export function toBackendEnum<T extends Record<string, number>>(
  value: string | number,
  enumMap: T
): number {
  if (typeof value === 'number') return value;
  const numValue = (enumMap as any)[value];
  if (numValue === undefined) {
    console.warn(`Unknown enum value: ${value}, defaulting to 0`);
    return 0;
  }
  return numValue;
}

/**
 * Convert backend integer enum to frontend string
 */
export function toFrontendEnum(
  value: number | string,
  statusMap: Record<number, string>
): string {
  if (typeof value === 'string') return value;
  const stringValue = statusMap[value];
  if (!stringValue) {
    console.warn(`Unknown enum value: ${value}, defaulting to first status`);
    return Object.values(statusMap)[0] || 'Unknown';
  }
  return stringValue;
}

// Convenience functions for specific enums
export const getOrderStatusString = (status: number | string): string => {
  if (typeof status === 'string') return status;
  return toFrontendEnum(status, OrderStatusMap);
};

export const getUserLicenseTypeString = (type: number | string): string => {
  if (typeof type === 'string') return type;
  return toFrontendEnum(type, UserLicenseTypeMap);
};

export const getSubscriptionStatusString = (status: number | string): string => {
  if (typeof status === 'string') return status;
  return toFrontendEnum(status, SubscriptionStatusMap);
};

export const getPaymentStatusString = (status: number | string): string => {
  if (typeof status === 'string') return status;
  return toFrontendEnum(status, PaymentStatusMap);
};

export const getOrderTypeString = (type: number | string): string => {
  if (typeof type === 'string') return type;
  return toFrontendEnum(type, OrderTypeMap);
};

export const getSubscriptionChangeTypeString = (type: number | string): string => {
  if (typeof type === 'string') return type;
  return toFrontendEnum(type, SubscriptionChangeTypeMap);
};
