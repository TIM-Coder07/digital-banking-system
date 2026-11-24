import { Types } from "mongoose";
import { Transaction } from "@/server/models/Transaction";
import { Account } from "@/server/models/Account";
import { AppError } from "@/server/utils/errors";
import { dateRange, escapeRegex } from "@/server/utils/query";
import type { AuthUser } from "@/server/auth/guard";

export async function accountIdsForUser(userId: string) {
  const rows = await Account.find({ owner: userId }).select("_id").lean();
  return rows.map((r) => r._id);
}

export type TxnFilters = {
  q?: string | null;
  type?: string | null;
  status?: string | null;
  accountId?: string | null;
  from?: string | null;
  to?: string | null;
  flagged?: boolean;
  skip: number;
  limit: number;
};

export async function listTransactions(user: AuthUser, f: TxnFilters) {
  const filter: Record<string, unknown> = {};

  if (user.role === "CUSTOMER") {
    // Customers only ever see transactions that touch their own accounts.
    const ids = await accountIdsForUser(user.id);
    let scope = ids;
    if (f.accountId) {
      const match = ids.find((id) => id.equals(f.accountId!));
      if (!match) throw new AppError(404, "Account not found");
      scope = [match];
    }
    filter.$or = [{ fromAccount: { $in: scope } }, { toAccount: { $in: scope } }];
  } else if (f.accountId && Types.ObjectId.isValid(f.accountId)) {
    const id = new Types.ObjectId(f.accountId);
    filter.$or = [{ fromAccount: id }, { toAccount: id }];
  }

  if (f.q) filter.txnId = { $regex: `^${escapeRegex(f.q.trim().toUpperCase())}` };
  if (f.type) filter.type = f.type;
  if (f.status) filter.status = f.status;
  if (f.flagged && user.role !== "CUSTOMER") filter.flagged = true;
  const range = dateRange(f.from, f.to);
  if (range) filter.createdAt = range;

  const projection = user.role === "CUSTOMER" ? "-flagged -flagReason -flaggedBy" : "";
  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .select(projection)
      .sort({ createdAt: -1 })
      .skip(f.skip)
      .limit(f.limit)
      .populate("fromAccount", "accountNumber type")
      .populate("toAccount", "accountNumber type")
      .lean(),
    Transaction.countDocuments(filter),
  ]);
  return { items, total };
}

/** Accepts either the Mongo _id or the public txnId. */
export async function getTransactionForUser(user: AuthUser, idOrRef: string) {
  const filter = Types.ObjectId.isValid(idOrRef) ? { _id: idOrRef } : { txnId: idOrRef.toUpperCase() };
  const txn = await Transaction.findOne(filter)
    .populate({ path: "fromAccount", select: "accountNumber type owner", populate: { path: "owner", select: "name" } })
    .populate({ path: "toAccount", select: "accountNumber type owner", populate: { path: "owner", select: "name" } })
    .lean();
  if (!txn) throw new AppError(404, "Transaction not found");

  if (user.role === "CUSTOMER") {
    const ids = await accountIdsForUser(user.id);
    const touches = (ref: unknown) => !!ref && ids.some((id) => id.equals((ref as { _id: Types.ObjectId })._id));
    if (!touches(txn.fromAccount) && !touches(txn.toAccount)) throw new AppError(404, "Transaction not found");
    const { flagged: _f, flagReason: _r, flaggedBy: _b, ...safe } = txn;
    return safe;
  }
  return txn;
}

export async function flagTransaction(user: AuthUser, id: string, flagged: boolean, reason?: string) {
  if (!flagged && user.role !== "ADMIN") throw new AppError(403, "Only admin can clear a flag");
  const txn = await Transaction.findByIdAndUpdate(
    id,
    { $set: { flagged, flagReason: flagged ? reason ?? "Flagged by staff" : undefined, flaggedBy: user.id } },
    { new: true }
  );
  if (!txn) throw new AppError(404, "Transaction not found");
  return txn;
}
