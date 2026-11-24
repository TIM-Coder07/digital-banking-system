import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** A replayed transfer request with the same key returns the original result. */
const idempotencyKeySchema = new Schema({
  key: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  transaction: { type: Schema.Types.ObjectId, ref: "Transaction" },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 },
});

idempotencyKeySchema.index({ user: 1, key: 1 }, { unique: true });

export type IdempotencyKeyDoc = InferSchemaType<typeof idempotencyKeySchema>;
export const IdempotencyKey =
  (models.IdempotencyKey as Model<IdempotencyKeyDoc>) || model<IdempotencyKeyDoc>("IdempotencyKey", idempotencyKeySchema);
