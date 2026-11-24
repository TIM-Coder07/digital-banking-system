import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { REQUEST_STATUS, REQUEST_TYPES } from "@/lib/constants";

/** Deposit / withdrawal request waiting for staff or admin approval. */
const fundRequestSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: [...REQUEST_TYPES], required: true },
    amount: { type: Number, required: true, min: 1 },
    description: { type: String, trim: true, maxlength: 200 },
    status: { type: String, enum: [...REQUEST_STATUS], default: "PENDING", index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true },
    transaction: { type: Schema.Types.ObjectId, ref: "Transaction" },
  },
  { timestamps: true }
);

export type FundRequestDoc = InferSchemaType<typeof fundRequestSchema>;
export const FundRequest =
  (models.FundRequest as Model<FundRequestDoc>) || model<FundRequestDoc>("FundRequest", fundRequestSchema);
