import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and hyphens"),
  imageUrl: z.string().url().optional().nullable(),
  publicId: z.string().optional().nullable(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and hyphens"),
  description: z.string().trim().min(10).max(5000),
  sku: z.string().trim().min(2).max(50),
  price: z.coerce.number().positive("Price must be greater than 0"),
  discountPrice: z.coerce.number().positive().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  isActive: z.boolean().default(true),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string().min(1),
      }),
    )
    .default([]),
  quantity: z.coerce.number().int().min(0).default(0),
  reorderLevel: z.coerce.number().int().min(0).default(5),
});

export const inventorySchema = z.object({
  quantity: z.coerce.number().int().min(0),
  reorderLevel: z.coerce.number().int().min(0),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().min(10).max(2000),
  basePrice: z.coerce.number().positive(),
  isActive: z.boolean().default(true),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().nullable(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type InventoryInput = z.infer<typeof inventorySchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
