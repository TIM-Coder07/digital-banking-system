import { z } from "zod";
import { pin } from "./common";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password is too short"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerCustomerSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^\+?\d{10,15}$/, "Enter a valid phone number"),
  address: z.string().trim().min(3, "Address is required").max(200),
  nationalId: z.string().trim().min(6, "National ID is required").max(20),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/\d/, "Add a number"),
});
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;

export const setPinSchema = z.object({
  pin,
  currentPassword: z.string().min(1, "Enter your password"),
});
export type SetPinInput = z.infer<typeof setPinSchema>;
