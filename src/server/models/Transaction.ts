import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { TXN_STATUS, TXN_TYPES } from "@/lib/constants";

/**
 * One document per money movement. It references both sides, so sender and
 * receiver each see it in their history. Never deleted; no API edits amounts.
 */
const transactionSchema = new Schema(
  {
    txnId: { type: String, required: true, unique: true },
    type: { type: String, enum: [...TXN_TYPES], required: true, index: true },
    fromAccount: { type: Schema.Types.ObjectId, ref: "Account" },
    toAccount: { type: Schema.Types.ObjectId, ref: "Account" },
    amount: { type: Number, required: true, min: 1 },
    fee: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: [...TXN_STATUS], default: "COMPLETED", index: true },
    description: { type: String, trim: true, maxlength: 300 },
    initiatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    balanceAfterFrom: { type: Number },
    balanceAfterTo: { type: Number },
    loan: { type: Schema.Types.ObjectId, ref: "Loan" },
    request: { type: Schema.Types.ObjectId, ref: "FundRequest" },
    flagged: { type: Boolean, default: false, index: true },
    flagReason: { type: String },
    flaggedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

transactionSchema.index({ fromAccount: 1, createdAt: -1 });
transactionSchema.index({ toAccount: 1, createdAt: -1 });

export type TransactionDoc = InferSchemaType<typeof transactionSchema>;
export const Transaction =
  (models.Transaction as Model<TransactionDoc>) || model<TransactionDoc>("Transaction", transactionSchema);
