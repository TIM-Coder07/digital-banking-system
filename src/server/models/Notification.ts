import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { NOTIFICATION_TYPES } from "@/lib/constants";

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: [...NOTIFICATION_TYPES], default: "GENERAL" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type NotificationDoc = InferSchemaType<typeof notificationSchema>;
export const Notification =
  (models.Notification as Model<NotificationDoc>) || model<NotificationDoc>("Notification", notificationSchema);
