import { z } from "zod";
import { accountNumber, amountTaka, objectId, pin } from "./common";

export const transferSchema = z.object({
  fromAccountId: objectId,
  toAccountNumber: accountNumber,
  amount: amountTaka,
  description: z.string().trim().max(140, "Max 140 characters").optional(),
  pin,
});
export type TransferValues = z.infer<typeof transferSchema>;

export const flagSchema = z.object({
  flagged: z.boolean().default(true),
  reason: z.string().trim().max(300).optional(),
});
