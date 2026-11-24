import { z } from "zod";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

/** Amount typed by the user in taka. Converted to paisa on the server only. */
export const amountTaka = z.coerce
  .number({ invalid_type_error: "Enter an amount" })
  .positive("Amount must be greater than 0")
  .max(100_000_000, "Amount is too large")
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, "Use at most 2 decimal places");

export const pin = z.string().regex(/^\d{4,6}$/, "PIN must be 4 to 6 digits");

export const accountNumber = z.string().regex(/^\d{12}$/, "Account number must be 12 digits");
