import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email"),
    phone: z
      .string()
      .min(7, "Enter a valid phone number")
      .regex(/^[0-9+\-\s]+$/, "Enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["passenger", "rider"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
