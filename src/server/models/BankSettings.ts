import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Singleton document (key = "global"). All money values in paisa. */
const bankSettingsSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true },
    dailyTransferLimit: { type: Number, default: 5_000_000 }, // 50,000 BDT
    maxSingleTransaction: { type: Number, default: 2_500_000 }, // 25,000 BDT
    minimumBalance: { type: Number, default: 50_000 }, // 500 BDT
    transferFeeBps: { type: Number, default: 10 }, // 0.10% for transfers to other customers
    loanInterestRate: { type: Number, default: 12 }, // % per year
    largeTransactionThreshold: { type: Number, default: 2_000_000 }, // 20,000 BDT
    velocityLimit: { type: Number, default: 5 }, // transfers per 10 minutes before flagging
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type BankSettingsDoc = InferSchemaType<typeof bankSettingsSchema>;
export const BankSettings =
  (models.BankSettings as Model<BankSettingsDoc>) || model<BankSettingsDoc>("BankSettings", bankSettingsSchema);
