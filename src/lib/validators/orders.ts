import { z } from "zod";

export const measurementSchema = z.object({
  label: z.string().trim().min(2).max(100),
  heightCm: z.coerce.number().positive().optional().nullable(),
  chestCm: z.coerce.number().positive().optional().nullable(),
  waistCm: z.coerce.number().positive().optional().nullable(),
  hipCm: z.coerce.number().positive().optional().nullable(),
  shoulderCm: z.coerce.number().positive().optional().nullable(),
  sleeveLengthCm: z.coerce.number().positive().optional().nullable(),
  inseamCm: z.coerce.number().positive().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(50),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Your cart is empty"),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(100),
  paymentMethod: z.enum(["COD", "CARD", "BANK_TRANSFER"]),
});

export const tailoringRequestSchema = z.object({
  serviceId: z.string().min(1, "Choose a service"),
  measurementId: z.string().min(1, "Choose or add a measurement profile"),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(100),
  paymentMethod: z.enum(["COD", "CARD", "BANK_TRANSFER"]),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const orderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED"]),
});

export const assignProviderSchema = z.object({
  providerId: z.string().min(1),
});

export const deliveryUpdateSchema = z.object({
  status: z.enum(["PENDING", "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED"]),
  trackingNumber: z.string().trim().max(100).optional().nullable(),
});

export const paymentUpdateSchema = z.object({
  status: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]),
  transactionRef: z.string().trim().max(150).optional().nullable(),
});

export type MeasurementInput = z.infer<typeof measurementSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type TailoringRequestInput = z.infer<typeof tailoringRequestSchema>;
export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
export type AssignProviderInput = z.infer<typeof assignProviderSchema>;
export type DeliveryUpdateInput = z.infer<typeof deliveryUpdateSchema>;
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;
