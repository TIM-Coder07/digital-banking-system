import { z } from "zod";
import { EMPLOYMENT_STATUS, LOAN_TYPES } from "@/lib/constants";
import { amountTaka, objectId, pin } from "./common";

export const applyLoanSchema = z.object({
  accountId: objectId,
  loanType: z.enum(LOAN_TYPES),
  amount: amountTaka.refine((v) => v >= 1000, "Minimum loan is 1,000"),
  durationMonths: z.coerce.number().int().min(3, "Minimum 3 months").max(360, "Maximum 360 months"),
  monthlyIncome: amountTaka,
  employmentStatus: z.enum(EMPLOYMENT_STATUS),
  description: z.string().trim().min(10, "Tell us a little more").max(1000),
});
export type ApplyLoanValues = z.infer<typeof applyLoanSchema>;

export const loanDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().trim().max(500).optional(),
});

export const loanNoteSchema = z.object({
  note: z.string().trim().min(1, "Note is empty").max(1000),
});

export const repaySchema = z.object({
  accountId: objectId,
  pin,
});
export type RepayValues = z.infer<typeof repaySchema>;
