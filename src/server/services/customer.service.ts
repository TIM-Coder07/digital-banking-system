import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { User } from "@/server/models/User";
import { Account } from "@/server/models/Account";
import { Transaction } from "@/server/models/Transaction";
import { AppError } from "@/server/utils/errors";
import { escapeRegex } from "@/server/utils/query";
import { hashPin } from "@/server/auth/pin";
import type { RegisterCustomerInput } from "@/lib/validations/auth.schema";
import type { UserStatus } from "@/lib/constants";

const PUBLIC_FIELDS = "name email phone address nationalId role status isVerified createdAt";

export async function createCustomer(data: RegisterCustomerInput, createdBy: string | null) {
  const email = data.email.toLowerCase();
  if (await User.exists({ email })) throw new AppError(409, "A user with this email already exists");

  const user = await User.create({
    name: data.name,
    email,
    phone: data.phone,
    address: data.address,
    nationalId: data.nationalId,
    passwordHash: await bcrypt.hash(data.password, 10),
    role: "CUSTOMER",
    status: "ACTIVE",
    isVerified: false,
    createdBy: createdBy ?? undefined,
  });
  return { _id: user._id, name: user.name, email: user.email };
}

export async function listCustomers(opts: { q?: string | null; status?: string | null; skip: number; limit: number }) {
  const filter: Record<string, unknown> = { role: "CUSTOMER" };
  if (opts.q) {
    const rx = new RegExp(escapeRegex(opts.q), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { nationalId: rx }];
  }
  if (opts.status) filter.status = opts.status;

  const [items, total] = await Promise.all([
    User.find(filter).select(PUBLIC_FIELDS).sort({ createdAt: -1 }).skip(opts.skip).limit(opts.limit).lean(),
    User.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getCustomerDetail(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(400, "Invalid id");
  const user = await User.findOne({ _id: id, role: "CUSTOMER" }).select(PUBLIC_FIELDS).lean();
  if (!user) throw new AppError(404, "Customer not found");

  const accounts = await Account.find({ owner: id }).lean();
  const ids = accounts.map((a) => a._id);
  const transactionCount = await Transaction.countDocuments({
    $or: [{ fromAccount: { $in: ids } }, { toAccount: { $in: ids } }],
  });
  return { ...user, accounts, transactionCount };
}

/** Blocking a customer also freezes all of their active accounts. */
export async function setCustomerStatus(id: string, status: UserStatus) {
  const user = await User.findOneAndUpdate({ _id: id, role: "CUSTOMER" }, { $set: { status } }, { new: true }).select(PUBLIC_FIELDS);
  if (!user) throw new AppError(404, "Customer not found");
  if (status === "BLOCKED") await Account.updateMany({ owner: id, status: "ACTIVE" }, { $set: { status: "FROZEN" } });
  return user;
}

export async function verifyCustomer(id: string, verifierId: string) {
  const user = await User.findOneAndUpdate(
    { _id: id, role: "CUSTOMER" },
    { $set: { isVerified: true, verifiedBy: verifierId } },
    { new: true }
  ).select(PUBLIC_FIELDS);
  if (!user) throw new AppError(404, "Customer not found");
  return user;
}

export async function setTransactionPin(userId: string, pin: string, currentPassword: string) {
  const user = await User.findById(userId).select("+passwordHash +pinHash");
  if (!user) throw new AppError(404, "User not found");
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw new AppError(401, "Current password is incorrect");
  user.pinHash = await hashPin(pin);
  user.pinAttempts = 0;
  user.pinLockedUntil = null;
  await user.save();
}
