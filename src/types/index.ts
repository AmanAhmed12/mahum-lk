// Shared literal types mirrored from prisma/schema.prisma.
// Kept as plain string literal unions (not imported from the generated
// Prisma client) so they are safe to use in Edge Runtime code such as
// middleware.ts, which cannot bundle the Prisma client/engine.

export const ROLES = ["ADMIN", "SERVICE_PROVIDER", "CUSTOMER"] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_TYPES = ["PRODUCT", "TAILORING"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["COD", "CARD", "BANK_TRANSFER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DELIVERY_STATUSES = [
  "PENDING",
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
}
