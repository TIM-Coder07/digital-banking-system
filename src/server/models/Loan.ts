import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { EMPLOYMENT_STATUS, LOAN_STATUS, LOAN_TYPES } from "@/lib/constants";

const scheduleItem = new Schema(
  {
    installmentNo: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date },
    transaction: { type: Schema.Types.ObjectId, ref: "Transaction" },
  },
  { _id: false }
);

const historyItem = new Schema(
  {
    status: { type: String, enum: [...LOAN_STATUS], required: true },
    by: { type: Schema.Types.ObjectId, ref: "User" },
    note: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const loanSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    account: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    loanType: { type: String, enum: [...LOAN_TYPES], required: true },
    amount: { type: Number, required: true, min: 1 },
    durationMonths: { type: Number, required: true, min: 1 },
    interestRate: { type: Number, required: true },
    monthlyIncome: { type: Number, required: true },
    employmentStatus: { type: String, enum: [...EMPLOYMENT_STATUS], required: true },
    description: { type: String, trim: true },
    status: { type: String, enum: [...LOAN_STATUS], default: "PENDING", index: true },
    forwardedBy: { type: Schema.Types.ObjectId, ref: "User" },
    forwardedAt: { type: Date },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    decidedAt: { type: Date },
    decisionReason: { type: String },
    emiAmount: { type: Number },
    totalPayable: { type: Number },
    remainingBalance: { type: Number },
    disbursedAt: { type: Date },
    disbursementTransaction: { type: Schema.Types.ObjectId, ref: "Transaction" },
    schedule: { type: [scheduleItem], default: [] },
    statusHistory: { type: [historyItem], default: [] },
  },
  { timestamps: true }
);

export type LoanDoc = InferSchemaType<typeof loanSchema>;
export const Loan = (models.Loan as Model<LoanDoc>) || model<LoanDoc>("Loan", loanSchema);
