import { z } from "zod";

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .regex(/^[0-9+\-\s]+$/, "Enter a valid phone number"),
  address: z.string().max(200, "Address is too long").optional().or(z.literal("")),
});
export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
