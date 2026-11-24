import { z } from "zod";
import { ACCOUNT_STATUS, ACCOUNT_TYPES, USER_STATUS } from "@/lib/constants";
import { amountTaka, objectId } from "./common";

export const createAccountSchema = z.object({
  ownerId: objectId,
  type: z.enum(ACCOUNT_TYPES),
});

export const updateAccountSchema = z.object({
  type: z.enum(ACCOUNT_TYPES),
});

export const accountStatusSchema = z.object({
  status: z.enum(ACCOUNT_STATUS),
});

export const customerStatusSchema = z.object({
  status: z.enum(USER_STATUS),
});

/** null means "use the bank default" */
export const accountLimitsSchema = z.object({
  dailyTransferLimit: amountTaka.nullable().optional(),
  singleTransactionLimit: amountTaka.nullable().optional(),
  minimumBalance: z.coerce.number().min(0).nullable().optional(),
});

export const bankSettingsSchema = z.object({
  dailyTransferLimit: amountTaka,
  maxSingleTransaction: amountTaka,
  minimumBalance: z.coerce.number().min(0),
  transferFeeBps: z.coerce.number().int().min(0).max(500),
  loanInterestRate: z.coerce.number().min(0).max(40),
  largeTransactionThreshold: amountTaka,
  velocityLimit: z.coerce.number().int().min(2).max(100),
});
