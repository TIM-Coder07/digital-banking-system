import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const loanRepaymentSchema = new Schema(
  {
    loan: { type: Schema.Types.ObjectId, ref: "Loan", required: true, index: true },
    account: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    amount: { type: Number, required: true, min: 1 },
    installmentNo: { type: Number, required: true },
    transaction: { type: Schema.Types.ObjectId, ref: "Transaction", required: true },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export type LoanRepaymentDoc = InferSchemaType<typeof loanRepaymentSchema>;
export const LoanRepayment =
  (models.LoanRepayment as Model<LoanRepaymentDoc>) || model<LoanRepaymentDoc>("LoanRepayment", loanRepaymentSchema);
