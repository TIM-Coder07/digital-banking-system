import { z } from "zod";
import { REQUEST_TYPES } from "@/lib/constants";
import { amountTaka, objectId } from "./common";

export const fundRequestSchema = z.object({
  accountId: objectId,
  type: z.enum(REQUEST_TYPES),
  amount: amountTaka,
  description: z.string().trim().max(200).optional(),
});
export type FundRequestValues = z.infer<typeof fundRequestSchema>;

export const reviewSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(300).optional(),
});
export type ReviewValues = z.infer<typeof reviewSchema>;
