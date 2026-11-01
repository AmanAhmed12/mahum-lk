import { z } from "zod";

export const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(7).max(20).optional().or(z.literal("")),
  password: z.string().min(8).max(72),
  role: z.enum(["ADMIN", "SERVICE_PROVIDER"]),
  specialization: z.string().trim().max(150).optional().or(z.literal("")),
  experienceYears: z.coerce.number().int().min(0).max(80).optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
