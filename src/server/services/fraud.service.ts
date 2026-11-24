import type { Types } from "mongoose";
import { Transaction } from "@/server/models/Transaction";
import { Account } from "@/server/models/Account";
import { getSettings } from "./settings.service";

/**
 * Simple rule based detection. Flagged transactions show up in the admin
 * "Flagged" queue. Rules:
 *  1. amount at or above the large transaction threshold
 *  2. too many transfers from one account in 10 minutes
 *  3. first ever transfer to a recipient that moves over half the balance
 */
export async function evaluateTransaction(id: Types.ObjectId | string) {
  const txn = await Transaction.findById(id);
  if (!txn || !txn.fromAccount || txn.type !== "TRANSFER") return;

  const settings = await getSettings();
  const reasons: string[] = [];

  if (txn.amount >= settings.largeTransactionThreshold) reasons.push("Large amount");

  const recent = await Transaction.countDocuments({
    fromAccount: txn.fromAccount,
    type: "TRANSFER",
    createdAt: { $gte: new Date(Date.now() - 10 * 60_000) },
  });
  if (recent >= settings.velocityLimit) reasons.push(`${recent} transfers in 10 minutes`);

  const priorToSame = await Transaction.countDocuments({
    fromAccount: txn.fromAccount,
    toAccount: txn.toAccount,
    _id: { $ne: txn._id },
  });
  const from = await Account.findById(txn.fromAccount).select("balance");
  const balanceBefore = (from?.balance ?? 0) + txn.amount + txn.fee;
  if (priorToSame === 0 && balanceBefore > 0 && txn.amount > balanceBefore * 0.5) {
    reasons.push("First transfer to this recipient moves over 50% of balance");
  }

  if (reasons.length) {
    txn.flagged = true;
    txn.flagReason = reasons.join("; ");
    await txn.save();
  }
}
