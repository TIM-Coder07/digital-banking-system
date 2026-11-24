import mongoose, { Types } from "mongoose";
import { FundRequest } from "@/server/models/FundRequest";
import { Account } from "@/server/models/Account";
import { Transaction } from "@/server/models/Transaction";
import { AppError } from "@/server/utils/errors";
import { generateTxnId } from "@/server/utils/ids";
import { getOwnedAccount } from "./account.service";
import { getSettings } from "./settings.service";
import { notify } from "./notification.service";
import type { AuthUser } from "@/server/auth/guard";
import type { RequestType } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

export async function createFundRequest(
  userId: string,
  data: { accountId: string; type: RequestType; amount: number; description?: string }
) {
  const account = await getOwnedAccount(data.accountId, userId);
  if (account.status !== "ACTIVE") throw new AppError(403, "Account is not active");
  if (data.type === "WITHDRAWAL" && account.balance < data.amount) throw new AppError(422, "Insufficient balance");

  const pending = await FundRequest.countDocuments({ customer: userId, status: "PENDING" });
  if (pending >= 5) throw new AppError(429, "You already have 5 pending requests");

  return FundRequest.create({
    account: account._id,
    customer: userId,
    type: data.type,
    amount: data.amount,
    description: data.description,
    status: "PENDING",
  });
}

export async function listFundRequests(
  user: AuthUser,
  opts: { status?: string | null; type?: string | null; skip: number; limit: number }
) {
  const filter: Record<string, unknown> = {};
  if (user.role === "CUSTOMER") filter.customer = new Types.ObjectId(user.id);
  if (opts.status) filter.status = opts.status;
  if (opts.type) filter.type = opts.type;

  const [items, total] = await Promise.all([
    FundRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .populate("account", "accountNumber type")
      .populate("customer", "name email")
      .lean(),
    FundRequest.countDocuments(filter),
  ]);
  return { items, total };
}

/**
 * Approve or reject. The status flip is conditional on PENDING, so a request
 * can never be approved twice, and the balance change commits with it.
 */
export async function reviewFundRequest(reviewer: AuthUser, requestId: string, decision: "APPROVE" | "REJECT", note?: string) {
  if (!Types.ObjectId.isValid(requestId)) throw new AppError(400, "Invalid request");
  const session = await mongoose.startSession();
  const out: { id?: Types.ObjectId } = {};

  try {
    await session.withTransaction(async () => {
      const req = await FundRequest.findById(requestId).session(session);
      if (!req) throw new AppError(404, "Request not found");
      if (req.customer.equals(reviewer.id)) throw new AppError(403, "You cannot review your own request");
      if (req.status !== "PENDING") throw new AppError(409, `Request already ${req.status.toLowerCase()}`);

      const claimed = await FundRequest.findOneAndUpdate(
        { _id: req._id, status: "PENDING" },
        {
          $set: {
            status: decision === "APPROVE" ? "APPROVED" : "REJECTED",
            reviewedBy: reviewer.id,
            reviewedAt: new Date(),
            reviewNote: note,
          },
        },
        { session, new: true }
      );
      if (!claimed) throw new AppError(409, "Request was already reviewed");
      out.id = claimed._id;

      const kind = req.type === "DEPOSIT" ? "Deposit" : "Withdrawal";
      if (decision === "REJECT") {
        await notify(
          [
            {
              user: req.customer,
              type: req.type === "DEPOSIT" ? "DEPOSIT_REJECTED" : "WITHDRAWAL_REJECTED",
              title: `${kind} rejected`,
              message: `Your ${kind.toLowerCase()} request of ${formatMoney(req.amount)} was rejected.${note ? ` Note: ${note}` : ""}`,
              link: "/customer/requests",
            },
          ],
          session
        );
        return;
      }

      const settings = await getSettings(session);
      const account = await Account.findById(req.account).session(session);
      if (!account) throw new AppError(404, "Account not found");
      const minBalance = account.minimumBalance ?? settings.minimumBalance;

      const updated =
        req.type === "DEPOSIT"
          ? await Account.findOneAndUpdate(
              { _id: req.account, status: "ACTIVE" },
              { $inc: { balance: req.amount } },
              { session, new: true }
            )
          : await Account.findOneAndUpdate(
              { _id: req.account, status: "ACTIVE", balance: { $gte: req.amount + minBalance } },
              { $inc: { balance: -req.amount } },
              { session, new: true }
            );
      if (!updated) {
        throw new AppError(
          422,
          req.type === "DEPOSIT" ? "Account is not active" : "Insufficient balance or account not active. Reject this request instead."
        );
      }

      const [txn] = await Transaction.create(
        [
          {
            txnId: generateTxnId(),
            type: req.type,
            fromAccount: req.type === "WITHDRAWAL" ? req.account : undefined,
            toAccount: req.type === "DEPOSIT" ? req.account : undefined,
            amount: req.amount,
            fee: 0,
            status: "COMPLETED",
            description: req.description || `${kind} approved`,
            initiatedBy: reviewer.id,
            request: req._id,
            ...(req.type === "DEPOSIT" ? { balanceAfterTo: updated.balance } : { balanceAfterFrom: updated.balance }),
          },
        ],
        { session }
      );

      claimed.transaction = txn._id;
      await claimed.save({ session });

      await notify(
        [
          {
            user: req.customer,
            type: req.type === "DEPOSIT" ? "DEPOSIT_APPROVED" : "WITHDRAWAL_APPROVED",
            title: `${kind} approved`,
            message: `${formatMoney(req.amount)} ${req.type === "DEPOSIT" ? "added to" : "withdrawn from"} your account. Ref ${txn.txnId}`,
            link: `/customer/transactions/${txn._id}`,
          },
        ],
        session
      );
    });
  } finally {
    await session.endSession();
  }

  return FundRequest.findById(out.id).populate("account", "accountNumber type").populate("customer", "name email");
}
