import mongoose, { Types, type ClientSession } from "mongoose";
import { connectDB } from "@/server/db/connect";
import { Account } from "@/server/models/Account";
import { Transaction } from "@/server/models/Transaction";
import { User } from "@/server/models/User";
import { IdempotencyKey } from "@/server/models/IdempotencyKey";
import { verifyPin } from "@/server/auth/pin";
import { AppError, isDuplicateKey } from "@/server/utils/errors";
import { generateTxnId } from "@/server/utils/ids";
import { startOfTodayUTC } from "@/server/utils/query";
import { getSettings } from "./settings.service";
import { notify } from "./notification.service";
import { evaluateTransaction } from "./fraud.service";
import { formatMoney } from "@/lib/format";

export type TransferInput = {
  userId: string;
  fromAccountId: string;
  toAccountNumber: string;
  amount: number; // paisa, already converted on the server
  description?: string;
  pin: string;
  idempotencyKey: string;
};

async function findReplay(userId: string, key: string) {
  const existing = await IdempotencyKey.findOne({ user: userId, key });
  if (!existing?.transaction) return null;
  return Transaction.findById(existing.transaction);
}

async function sumTransfersToday(accountId: Types.ObjectId, session: ClientSession) {
  const [row] = await Transaction.aggregate<{ total: number }>([
    { $match: { fromAccount: accountId, type: "TRANSFER", status: "COMPLETED", createdAt: { $gte: startOfTodayUTC() } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).session(session);
  return row?.total ?? 0;
}

/**
 * Atomic fund transfer. Everything inside withTransaction commits together or
 * not at all, so money can never leave one account without reaching the other.
 */
export async function transferFunds(input: TransferInput) {
  await connectDB();
  if (!Types.ObjectId.isValid(input.fromAccountId)) throw new AppError(400, "Invalid source account");
  if (!Number.isInteger(input.amount) || input.amount <= 0) throw new AppError(400, "Invalid amount");

  // 1. Duplicate submit (double click, retry) returns the original transaction.
  const replay = await findReplay(input.userId, input.idempotencyKey);
  if (replay) return { transaction: replay, replayed: true };

  // 2. PIN
  await verifyPin(input.userId, input.pin);

  const session = await mongoose.startSession();
  const out: { id?: Types.ObjectId } = {};

  try {
    await session.withTransaction(async () => {
      // 3. Ownership is part of the query.
      const from = await Account.findOne({ _id: input.fromAccountId, owner: input.userId }).session(session);
      if (!from) throw new AppError(404, "Source account not found");
      if (from.status !== "ACTIVE") throw new AppError(403, `Source account is ${from.status.toLowerCase()}`, "ACCOUNT_NOT_ACTIVE");

      const to = await Account.findOne({ accountNumber: input.toAccountNumber }).session(session);
      if (!to) throw new AppError(404, "Recipient account not found", "RECIPIENT_NOT_FOUND");
      if (to._id.equals(from._id)) throw new AppError(400, "You cannot transfer to the same account");
      if (to.status !== "ACTIVE") throw new AppError(403, "Recipient account cannot receive funds", "RECIPIENT_NOT_ACTIVE");

      const recipient = await User.findById(to.owner).select("status name").session(session);
      if (!recipient || recipient.status !== "ACTIVE") throw new AppError(403, "Recipient account cannot receive funds");

      // 4. Limits, fee and minimum balance.
      const settings = await getSettings(session);
      const ownTransfer = to.owner.equals(from.owner);
      const fee = ownTransfer ? 0 : Math.round((input.amount * settings.transferFeeBps) / 10_000);
      const total = input.amount + fee;

      const singleLimit = from.singleTransactionLimit ?? settings.maxSingleTransaction;
      if (input.amount > singleLimit) {
        throw new AppError(422, `Maximum per transfer is ${formatMoney(singleLimit)}`, "LIMIT_SINGLE");
      }

      const dailyLimit = from.dailyTransferLimit ?? settings.dailyTransferLimit;
      const usedToday = await sumTransfersToday(from._id, session);
      if (usedToday + input.amount > dailyLimit) {
        throw new AppError(422, `Daily limit reached. Remaining today: ${formatMoney(Math.max(0, dailyLimit - usedToday))}`, "LIMIT_DAILY");
      }

      const minBalance = from.minimumBalance ?? settings.minimumBalance;

      // 5. Conditional debit: fails if balance changed in between (no overdraft, no race).
      const debited = await Account.findOneAndUpdate(
        { _id: from._id, status: "ACTIVE", balance: { $gte: total + minBalance } },
        { $inc: { balance: -total } },
        { session, new: true }
      );
      if (!debited) {
        throw new AppError(422, `Insufficient balance. Minimum balance of ${formatMoney(minBalance)} must remain.`, "INSUFFICIENT_FUNDS");
      }

      const credited = await Account.findOneAndUpdate(
        { _id: to._id, status: "ACTIVE" },
        { $inc: { balance: input.amount } },
        { session, new: true }
      );
      if (!credited) throw new AppError(409, "Recipient account became unavailable");

      // 6. One record, visible to both sides.
      const [txn] = await Transaction.create(
        [
          {
            txnId: generateTxnId(),
            type: "TRANSFER",
            fromAccount: from._id,
            toAccount: to._id,
            amount: input.amount,
            fee,
            status: "COMPLETED",
            description: input.description,
            initiatedBy: input.userId,
            balanceAfterFrom: debited.balance,
            balanceAfterTo: credited.balance,
          },
        ],
        { session }
      );

      await IdempotencyKey.create([{ key: input.idempotencyKey, user: input.userId, transaction: txn._id }], { session });

      await notify(
        [
          {
            user: from.owner,
            type: "TRANSFER_COMPLETED",
            title: "Transfer completed",
            message: `${formatMoney(input.amount)} sent to ${to.accountNumber.slice(-4).padStart(8, "•")}. Ref ${txn.txnId}`,
            link: `/customer/transactions/${txn._id}`,
          },
          ...(ownTransfer
            ? []
            : [
                {
                  user: to.owner,
                  type: "MONEY_RECEIVED" as const,
                  title: "Money received",
                  message: `You received ${formatMoney(input.amount)}. Ref ${txn.txnId}`,
                  link: `/customer/transactions/${txn._id}`,
                },
              ]),
        ],
        session
      );

      out.id = txn._id;
    });
  } catch (err) {
    // Two identical requests at the same time: the loser hits the unique key and rolls back.
    if (isDuplicateKey(err)) {
      const original = await findReplay(input.userId, input.idempotencyKey);
      if (original) return { transaction: original, replayed: true };
    }
    throw err;
  } finally {
    await session.endSession();
  }

  // 7. Fraud rules run after commit and never block the customer.
  await evaluateTransaction(out.id!).catch((e) => console.error("[fraud]", e));

  const transaction = await Transaction.findById(out.id)
    .populate("fromAccount", "accountNumber type")
    .populate("toAccount", "accountNumber type");
  return { transaction, replayed: false };
}
