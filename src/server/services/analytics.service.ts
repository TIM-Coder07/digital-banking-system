import { Types } from "mongoose";
import { Account } from "@/server/models/Account";
import { Loan } from "@/server/models/Loan";
import { Transaction } from "@/server/models/Transaction";
import { User } from "@/server/models/User";
import { AppError } from "@/server/utils/errors";

const MONTHS = 12;
const monthExpr = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };

function monthKeys(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1 - i), 1)).toISOString().slice(0, 7)
  );
}

function since(n: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1), 1));
}

export async function adminOverview() {
  const [customers, accounts, balanceAgg, typeTotals, pendingLoans, monthlyRaw, accountDist, loanStats] = await Promise.all([
    User.countDocuments({ role: "CUSTOMER" }),
    Account.countDocuments(),
    Account.aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: "$balance" } } }]),
    Transaction.aggregate<{ _id: string; amount: number; count: number }>([
      { $match: { status: "COMPLETED" } },
      { $group: { _id: "$type", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Loan.countDocuments({ status: { $in: ["PENDING", "UNDER_REVIEW"] } }),
    Transaction.aggregate<{ _id: { month: string; type: string }; amount: number; count: number }>([
      { $match: { status: "COMPLETED", createdAt: { $gte: since(MONTHS) } } },
      { $group: { _id: { month: monthExpr, type: "$type" }, amount: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Account.aggregate<{ _id: string; count: number; balance: number }>([
      { $group: { _id: "$type", count: { $sum: 1 }, balance: { $sum: "$balance" } } },
    ]),
    Loan.aggregate<{ _id: string; count: number; amount: number }>([
      { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } },
    ]),
  ]);

  const byType = Object.fromEntries(typeTotals.map((t) => [t._id, t]));
  const monthly = monthKeys(MONTHS).map((month) => {
    const row = { month, deposit: 0, withdrawal: 0, transfer: 0, loan: 0, count: 0 };
    for (const r of monthlyRaw.filter((x) => x._id.month === month)) {
      row.count += r.count;
      if (r._id.type === "DEPOSIT") row.deposit += r.amount;
      else if (r._id.type === "WITHDRAWAL") row.withdrawal += r.amount;
      else if (r._id.type === "TRANSFER") row.transfer += r.amount;
      else row.loan += r.amount;
    }
    return row;
  });

  return {
    totals: {
      customers,
      accounts,
      totalBalance: balanceAgg[0]?.total ?? 0,
      deposits: byType.DEPOSIT?.amount ?? 0,
      withdrawals: byType.WITHDRAWAL?.amount ?? 0,
      transactions: typeTotals.reduce((s, t) => s + t.count, 0),
      pendingLoans,
    },
    monthly,
    accountDistribution: accountDist.map((a) => ({ type: a._id, count: a.count, balance: a.balance })),
    loanStats: loanStats.map((l) => ({ status: l._id, count: l.count, amount: l.amount })),
  };
}

type Row = { _id: { month: string; type: string; out: boolean; inn: boolean }; amount: number; fee: number; count: number };

export async function customerOverview(userId: string, accountId?: string | null) {
  const accounts = await Account.find({ owner: userId }).lean();
  let scope = accounts;
  if (accountId) {
    scope = accounts.filter((a) => String(a._id) === accountId);
    if (!scope.length) throw new AppError(404, "Account not found");
  }
  const ids = scope.map((a) => a._id as Types.ObjectId);
  const touchesScope = { $or: [{ fromAccount: { $in: ids } }, { toAccount: { $in: ids } }] };

  const [rows, recent, activeLoans] = await Promise.all([
    Transaction.aggregate<Row>([
      { $match: { status: "COMPLETED", ...touchesScope } },
      {
        $group: {
          _id: {
            month: monthExpr,
            type: "$type",
            out: { $in: [{ $ifNull: ["$fromAccount", null] }, ids] },
            inn: { $in: [{ $ifNull: ["$toAccount", null] }, ids] },
          },
          amount: { $sum: "$amount" },
          fee: { $sum: "$fee" },
          count: { $sum: 1 },
        },
      },
    ]),
    Transaction.find(touchesScope)
      .select("-flagged -flagReason -flaggedBy")
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("fromAccount", "accountNumber type")
      .populate("toAccount", "accountNumber type")
      .lean(),
    Loan.find({ customer: userId, status: "ACTIVE" }).select("loanType amount remainingBalance emiAmount schedule").lean(),
  ]);

  const totals = { balance: scope.reduce((s, a) => s + a.balance, 0), deposits: 0, withdrawals: 0, received: 0, spent: 0 };
  const monthMap = new Map(monthKeys(MONTHS).map((m) => [m, { month: m, spending: 0, deposits: 0, received: 0 }]));
  const dist = new Map<string, { type: string; count: number; amount: number }>();

  for (const r of rows) {
    const { month, type, out, inn } = r._id;
    const m = monthMap.get(month);
    const d = dist.get(type) ?? { type, count: 0, amount: 0 };
    d.count += r.count;
    d.amount += r.amount;
    dist.set(type, d);

    if (type === "DEPOSIT") {
      totals.deposits += r.amount;
      if (m) m.deposits += r.amount;
    } else if (type === "WITHDRAWAL") {
      totals.withdrawals += r.amount;
    }
    if (out && !inn) {
      totals.spent += r.amount + r.fee;
      if (m) m.spending += r.amount + r.fee;
    }
    if (inn && !out && type !== "DEPOSIT") {
      totals.received += r.amount;
      if (m) m.received += r.amount;
    }
  }

  return {
    totals,
    monthly: [...monthMap.values()],
    distribution: [...dist.values()],
    recent,
    activeLoans: activeLoans.map((l) => ({
      _id: l._id,
      loanType: l.loanType,
      amount: l.amount,
      remainingBalance: l.remainingBalance ?? 0,
      emiAmount: l.emiAmount ?? 0,
      nextDue: l.schedule.find((s) => !s.paid)?.dueDate,
    })),
  };
}
