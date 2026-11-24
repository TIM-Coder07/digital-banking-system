import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ROLES, USER_STATUS } from "@/lib/constants";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    nationalId: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    pinHash: { type: String, select: false },
    pinAttempts: { type: Number, default: 0, select: false },
    pinLockedUntil: { type: Date, select: false },
    role: { type: String, enum: [...ROLES], default: "CUSTOMER", index: true },
    status: { type: String, enum: [...USER_STATUS], default: "ACTIVE" },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = (models.User as Model<UserDoc>) || model<UserDoc>("User", userSchema);
