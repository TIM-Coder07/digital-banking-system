import mongoose, { Types } from "mongoose";
import { Loan } from "@/server/models/Loan";
import { LoanNote } from "@/server/models/LoanNote";
import { LoanRepayment } from "@/server/models/LoanRepayment";
import { Account } from "@/server/models/Account";
import { Transaction } from "@/server/models/Transaction";
import { AppError } from "@/server/utils/errors";
import { generateTxnId } from "@/server/utils/ids";
import { verifyPin } from "@/server/auth/pin";
import { getOwnedAccount } from "./account.service";
import { getSettings } from "./settings.service";
import { notify } from "./notification.service";
import type { AuthUser } from "@/server/auth/guard";
import type { EmploymentStatus, LoanType } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

/** Standard EMI: P * r * (1+r)^n / ((1+r)^n - 1). All values in paisa. */
export function buildSchedule(principal: number, annualRate: number, months: number, start = new Date()) {
  const r = annualRate / 12 / 100;
  const emi =
    r === 0
      ? Math.ceil(principal / months)
      : Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
  const schedule = Array.from({ length: months }, (_, i) => {
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    return { installmentNo: i + 1, dueDate, amount: emi, paid: false };
  });
  return { emi, total: emi * months, schedule };
}

function assertId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(400, "Invalid loan id");
}

export async function applyForLoan(
  userId: string,
  data: {
    accountId: string;
    loanType: LoanType;
    amount: number;
    durationMonths: number;
    monthlyIncome: number;
    employmentStatus: EmploymentStatus;
    description: string;
  }
) {
  const account = await getOwnedAccount(data.accountId, userId);
  if (account.status !== "ACTIVE") throw new AppError(403, "Disbursement account must be active");

  const open = await Loan.countDocuments({ customer: userId, status: { $in: ["PENDING", "UNDER_REVIEW"] } });
  if (open > 0) throw new AppError(409, "You already have a loan application in progress");

  const settings = await getSettings();
  return Loan.create({
    customer: userId,
    account: account._id,
    loanType: data.loanType,
    amount: data.amount,
    durationMonths: data.durationMonths,
    interestRate: settings.loanInterestRate,
    monthlyIncome: data.monthlyIncome,
    employmentStatus: data.employmentStatus,
    description: data.description,
    status: "PENDING",
    statusHistory: [{ status: "PENDING", by: userId, note: "Application submitted" }],
  });
}

export async function listLoans(user: AuthUser, opts: { status?: string | null; skip: number; limit: number }) {
  const filter: Record<string, unknown> = {};
  if (user.role === "CUSTOMER") filter.customer = new Types.ObjectId(user.id);
  if (opts.status) filter.status = { $in: opts.status.split(",") };

  const [items, total] = await Promise.all([
    Loan.find(filter)
      .select("-schedule")
      .sort({ createdAt: -1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .populate("customer", "name email")
      .populate("account", "accountNumber type")
      .lean(),
    Loan.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getLoanDetail(user: AuthUser, id: string) {
  assertId(id);
  const filter = user.role === "CUSTOMER" ? { _id: id, customer: user.id } : { _id: id };
  const loan = await Loan.findOne(filter)
    .populate("customer", "name email phone monthlyIncome isVerified")
    .populate("account", "accountNumber type balance")
    .lean();
  if (!loan) throw new AppError(404, "Loan not found");

  const repayments = await LoanRepayment.find({ loan: id }).sort({ paidAt: -1 }).lean();
  // Internal notes are never sent to customers.
  const notes =
    user.role === "CUSTOMER"
      ? []
      : await LoanNote.find({ loan: id }).sort({ createdAt: -1 }).populate("author", "name role").lean();
  return { loan, repayments, notes };
}

export async function addLoanNote(author: AuthUser, id: string, note: string) {
  assertId(id);
  const loan = await Loan.findById(id).select("customer");
  if (!loan) throw new AppError(404, "Loan not found");
  if (loan.customer.equals(author.id)) throw new AppError(403, "You cannot add notes to your own loan");
  return LoanNote.create({ loan: id, author: author.id, note });
}

export async function forwardLoan(staff: AuthUser, id: string, note?: string) {
  assertId(id);
  const loan = await Loan.findById(id).select("customer status");
  if (!loan) throw new AppError(404, "Loan not found");
  if (loan.customer.equals(staff.id)) throw new AppError(403, "You cannot process your own loan application");

  const updated = await Loan.findOneAndUpdate(
    { _id: id, status: "PENDING" },
    {
      $set: { status: "UNDER_REVIEW", forwardedBy: staff.id, forwardedAt: new Date() },
      $push: { statusHistory: { status: "UNDER_REVIEW", by: staff.id, note: note || "Forwarded for admin approval" } },
    },
    { new: true }
  );
  if (!updated) throw new AppError(409, "Only pending applications can be forwarded");
  if (note) await LoanNote.create({ loan: id, author: staff.id, note });
  return updated;
}

/** Approve = disburse through a recorded LOAN_DISBURSEMENT transaction, atomically. */
export async function decideLoan(admin: AuthUser, id: string, decision: "APPROVE" | "REJECT", reason?: string) {
  assertId(id);
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const loan = await Loan.findById(id).session(session);
      if (!loan) throw new AppError(404, "Loan not found");
      if (loan.customer.equals(admin.id)) throw new AppError(403, "You cannot approve your own loan");
      if (!["PENDING", "UNDER_REVIEW"].includes(loan.status)) throw new AppError(409, `Loan is already ${loan.status.toLowerCase()}`);

      const claimed = await Loan.findOneAndUpdate(
        { _id: id, status: { $in: ["PENDING", "UNDER_REVIEW"] } },
        {
          $set: {
            status: decision === "APPROVE" ? "APPROVED" : "REJECTED",
            decidedBy: admin.id,
            decidedAt: new Date(),
            decisionReason: reason,
          },
          $push: { statusHistory: { status: decision === "APPROVE" ? "APPROVED" : "REJECTED", by: admin.id, note: reason } },
        },
        { session, new: true }
      );
      if (!claimed) throw new AppError(409, "Loan was already decided");

      if (decision === "REJECT") {
        await notify(
          [
            {
              user: claimed.customer,
              type: "LOAN_REJECTED",
              title: "Loan application rejected",
              message: `Your ${claimed.loanType.toLowerCase()} loan request was rejected.${reason ? ` Reason: ${reason}` : ""}`,
              link: `/customer/loans/${claimed._id}`,
            },
          ],
          session
        );
        return;
      }

      const credited = await Account.findOneAndUpdate(
        { _id: claimed.account, status: "ACTIVE" },
        { $inc: { balance: claimed.amount } },
        { session, new: true }
      );
      if (!credited) throw new AppError(422, "Disbursement account is not active");

      const [txn] = await Transaction.create(
        [
          {
            txnId: generateTxnId(),
            type: "LOAN_DISBURSEMENT",
            toAccount: claimed.account,
            amount: claimed.amount,
            fee: 0,
            status: "COMPLETED",
            description: `${claimed.loanType} loan disbursement`,
            initiatedBy: admin.id,
            loan: claimed._id,
            balanceAfterTo: credited.balance,
          },
        ],
        { session }
      );

      const now = new Date();
      const { emi, total, schedule } = buildSchedule(claimed.amount, claimed.interestRate, claimed.durationMonths, now);
      await Loan.updateOne(
        { _id: claimed._id },
        {
          $set: {
            status: "ACTIVE",
            emiAmount: emi,
            totalPayable: total,
            remainingBalance: total,
            disbursedAt: now,
            disbursementTransaction: txn._id,
            schedule,
          },
          $push: { statusHistory: { status: "ACTIVE", by: admin.id, note: `Disbursed. Ref ${txn.txnId}` } },
        },
        { session }
      );

      await notify(
        [
          {
            user: claimed.customer,
            type: "LOAN_APPROVED",
            title: "Loan approved",
            message: `${formatMoney(claimed.amount)} has been credited. Monthly installment ${formatMoney(emi)}.`,
            link: `/customer/loans/${claimed._id}`,
          },
        ],
        session
      );
    });
  } finally {
    await session.endSession();
  }

  return Loan.findById(id);
}

/** Pays the next unpaid installment from one of the customer's accounts. */
export async function repayLoan(userId: string, id: string, accountId: string, pin: string) {
  assertId(id);
  await verifyPin(userId, pin);
  const session = await mongoose.startSession();
  const out: { txnRef?: string } = {};

  try {
    await session.withTransaction(async () => {
      const loan = await Loan.findOne({ _id: id, customer: userId }).session(session);
      if (!loan) throw new AppError(404, "Loan not found");
      if (loan.status !== "ACTIVE") throw new AppError(409, "This loan is not active");

      const next = loan.schedule.find((s) => !s.paid);
      if (!next) throw new AppError(409, "All installments are already paid");
      const amount = Math.min(next.amount, loan.remainingBalance ?? next.amount);

      const account = await getOwnedAccount(accountId, userId, session);
      const settings = await getSettings(session);
      const minBalance = account.minimumBalance ?? settings.minimumBalance;

      const debited = await Account.findOneAndUpdate(
        { _id: account._id, status: "ACTIVE", balance: { $gte: amount + minBalance } },
        { $inc: { balance: -amount } },
        { session, new: true }
      );
      if (!debited) throw new AppError(422, "Insufficient balance for this installment", "INSUFFICIENT_FUNDS");

      const [txn] = await Transaction.create(
        [
          {
            txnId: generateTxnId(),
            type: "LOAN_REPAYMENT",
            fromAccount: account._id,
            amount,
            fee: 0,
            status: "COMPLETED",
            description: `Installment ${next.installmentNo} of ${loan.durationMonths}`,
            initiatedBy: userId,
            loan: loan._id,
            balanceAfterFrom: debited.balance,
          },
        ],
        { session }
      );

      await LoanRepayment.create(
        [{ loan: loan._id, account: account._id, amount, installmentNo: next.installmentNo, transaction: txn._id }],
        { session }
      );

      next.paid = true;
      next.paidAt = new Date();
      next.transaction = txn._id;
      loan.remainingBalance = Math.max(0, (loan.remainingBalance ?? 0) - amount);

      const finished = loan.remainingBalance === 0 || loan.schedule.every((s) => s.paid);
      if (finished) {
        loan.status = "COMPLETED";
        loan.statusHistory.push({ status: "COMPLETED", by: new Types.ObjectId(userId), note: "Fully repaid", at: new Date() });
      }
      await loan.save({ session });

      await notify(
        [
          {
            user: userId,
            type: "LOAN_REPAID",
            title: finished ? "Loan fully repaid" : "Installment paid",
            message: `${formatMoney(amount)} paid. Ref ${txn.txnId}`,
            link: `/customer/loans/${loan._id}`,
          },
        ],
        session
      );
      out.txnRef = txn.txnId;
    });
  } finally {
    await session.endSession();
  }

  return { loan: await Loan.findById(id), txnId: out.txnRef };
}
