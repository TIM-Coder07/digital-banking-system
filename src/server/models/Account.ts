import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ACCOUNT_STATUS, ACCOUNT_TYPES } from "@/lib/constants";

const accountSchema = new Schema(
  {
    accountNumber: { type: String, required: true, unique: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: [...ACCOUNT_TYPES], required: true },
    // Integer paisa. Only ever changed with conditional $inc inside a DB transaction.
    balance: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: "Balance must be an integer amount of paisa" },
    },
    status: { type: String, enum: [...ACCOUNT_STATUS], default: "ACTIVE" },
    // Per account overrides. Empty means bank default from BankSettings.
    dailyTransferLimit: { type: Number, default: null },
    singleTransactionLimit: { type: Number, default: null },
    minimumBalance: { type: Number, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type AccountDoc = InferSchemaType<typeof accountSchema>;
export const Account = (models.Account as Model<AccountDoc>) || model<AccountDoc>("Account", accountSchema);
