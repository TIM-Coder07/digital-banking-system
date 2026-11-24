import { Types, type ClientSession } from "mongoose";
import { Account } from "@/server/models/Account";
import { User } from "@/server/models/User";
import { AppError, isDuplicateKey } from "@/server/utils/errors";
import { generateAccountNumber } from "@/server/utils/ids";
import { escapeRegex } from "@/server/utils/query";
import type { AuthUser } from "@/server/auth/guard";
import type { AccountStatus, AccountType } from "@/lib/constants";

/** Ownership check lives in the query itself. */
export async function getOwnedAccount(accountId: string, userId: string, session?: ClientSession) {
  if (!Types.ObjectId.isValid(accountId)) throw new AppError(400, "Invalid account");
  const account = await Account.findOne({ _id: accountId, owner: userId }).session(session ?? null);
  if (!account) throw new AppError(404, "Account not found");
  return account;
}

export async function getAccountForUser(user: AuthUser, accountId: string) {
  if (!Types.ObjectId.isValid(accountId)) throw new AppError(400, "Invalid account");
  const filter = user.role === "CUSTOMER" ? { _id: accountId, owner: user.id } : { _id: accountId };
  const account = await Account.findOne(filter).populate("owner", "name email phone status").lean();
  if (!account) throw new AppError(404, "Account not found");
  return account;
}

export async function listAccounts(
  user: AuthUser,
  opts: { q?: string | null; status?: string | null; type?: string | null; ownerId?: string | null; skip: number; limit: number }
) {
  const filter: Record<string, unknown> = {};
  if (user.role === "CUSTOMER") filter.owner = new Types.ObjectId(user.id);
  else if (opts.ownerId && Types.ObjectId.isValid(opts.ownerId)) filter.owner = new Types.ObjectId(opts.ownerId);
  if (opts.q) filter.accountNumber = { $regex: `^${escapeRegex(opts.q)}` };
  if (opts.status) filter.status = opts.status;
  if (opts.type) filter.type = opts.type;

  const [items, total] = await Promise.all([
    Account.find(filter).sort({ createdAt: -1 }).skip(opts.skip).limit(opts.limit).populate("owner", "name email").lean(),
    Account.countDocuments(filter),
  ]);
  return { items, total };
}

export async function createAccount(creator: AuthUser, data: { ownerId: string; type: AccountType }) {
  const owner = await User.findOne({ _id: data.ownerId, role: "CUSTOMER" });
  if (!owner) throw new AppError(404, "Customer not found");
  if (owner.status !== "ACTIVE") throw new AppError(409, "Customer is not active");
  if (!owner.isVerified) throw new AppError(409, "Verify the customer's information before opening an account");

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await Account.create({
        accountNumber: generateAccountNumber(),
        owner: owner._id,
        type: data.type,
        balance: 0,
        status: "ACTIVE",
        createdBy: creator.id,
      });
    } catch (err) {
      if (!isDuplicateKey(err)) throw err; // account number collision, retry
    }
  }
  throw new AppError(500, "Could not generate a unique account number");
}

export async function updateAccount(id: string, data: { type: AccountType }) {
  const account = await Account.findByIdAndUpdate(id, { $set: { type: data.type } }, { new: true });
  if (!account) throw new AppError(404, "Account not found");
  return account;
}

export async function setAccountStatus(id: string, status: AccountStatus) {
  const account = await Account.findByIdAndUpdate(id, { $set: { status } }, { new: true });
  if (!account) throw new AppError(404, "Account not found");
  return account;
}

export async function setAccountLimits(
  id: string,
  limits: { dailyTransferLimit?: number | null; singleTransactionLimit?: number | null; minimumBalance?: number | null }
) {
  const account = await Account.findByIdAndUpdate(id, { $set: limits }, { new: true, runValidators: true });
  if (!account) throw new AppError(404, "Account not found");
  return account;
}
