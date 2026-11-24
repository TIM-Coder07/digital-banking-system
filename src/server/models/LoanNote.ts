import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Internal notes. Never returned to customers. */
const loanNoteSchema = new Schema(
  {
    loan: { type: Schema.Types.ObjectId, ref: "Loan", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

export type LoanNoteDoc = InferSchemaType<typeof loanNoteSchema>;
export const LoanNote = (models.LoanNote as Model<LoanNoteDoc>) || model<LoanNoteDoc>("LoanNote", loanNoteSchema);
