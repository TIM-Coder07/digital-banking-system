/**
 * npm run seed
 * Creates demo users, accounts, six months of transaction history, a pending
 * deposit request, a pending loan and an active (disbursed) loan.
 * WARNING: clears the demo collections first.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";
import mongoose, { Types } from "mongoose";
import { connectDB } from "../src/server/db/connect";
import { User } from "../src/server/models/User";
import { Account } from "../src/server/models/Account";
import { Transaction } from "../src/server/models/Transaction";
import { FundRequest } from "../src/server/models/FundRequest";
import { Loan } from "../src/server/models/Loan";
import { LoanNote } from "../src/server/models/LoanNote";
import { LoanRepayment } from "../src/server/models/LoanRepayment";
import { Notification } from "../src/server/models/Notification";
import { IdempotencyKey } from "../src/server/models/IdempotencyKey";
import { BankSettings } from "../src/server/models/BankSettings";
import { generateAccountNumber, generateTxnId } from "../src/server/utils/ids";
import { applyForLoan, decideLoan } from "../src/server/services/loan.service";
import type { AuthUser } from "../src/server/auth/guard";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const taka = (n: number) => n * 100;

async function main() {
  await connectDB();
  console.log("Connected. Clearing demo data...");
  await Promise.all(
    [User, Account, Transaction, FundRequest, Loan, LoanNote, LoanRepayment, Notification, IdempotencyKey, BankSettings].map(
      (m) => (m as unknown as mongoose.Model<unknown>).deleteMany({})
    )
  );
  await Promise.all(
    [User, Account, Transaction, FundRequest, Loan, LoanNote, LoanRepayment, Notification, IdempotencyKey, BankSettings].map(
      (m) => (m as unknown as mongoose.Model<unknown>).syncIndexes()
    )
  );
  await BankSettings.create({ key: "global" });

  const hash = (p: string) => bcrypt.hash(p, 10);
  const pinHash = await hash("1234");

  const admin = await User.create({ name: "Ayesha Rahman", email: "admin@bank.test", passwordHash: await hash("Admin@1234"), role: "ADMIN", isVerified: true });
  const staff = await User.create({ name: "Tanvir Hossain", email: "staff@bank.test", passwordHash: await hash("Staff@1234"), role: "STAFF", isVerified: true });
  const customerPw = await hash("Customer@1234");
  const rahim = await User.create({ name: "Rahim Uddin", email: "rahim@bank.test", phone: "+8801711000001", address: "Mirpur 10, Dhaka", nationalId: "1990123456", passwordHash: customerPw, pinHash, role: "CUSTOMER", isVerified: true, verifiedBy: staff._id });
  const karim = await User.create({ name: "Karim Ahmed", email: "karim@bank.test", phone: "+8801711000002", address: "Dhanmondi, Dhaka", nationalId: "1988123456", passwordHash: customerPw, pinHash, role: "CUSTOMER", isVerified: true, verifiedBy: staff._id });
  await User.create({ name: "Nusrat Jahan", email: "nusrat@bank.test", phone: "+8801711000003", address: "Uttara, Dhaka", nationalId: "1995123456", passwordHash: customerPw, role: "CUSTOMER", isVerified: false });

  const mk = (owner: Types.ObjectId, type: "SAVINGS" | "CURRENT" | "BUSINESS") =>
    Account.create({ accountNumber: generateAccountNumber(), owner, type, balance: 0, createdBy: staff._id });
  const accounts = [await mk(rahim._id, "SAVINGS"), await mk(rahim._id, "CURRENT"), await mk(karim._id, "SAVINGS"), await mk(karim._id, "BUSINESS")];
  const bal = new Map(accounts.map((a) => [String(a._id), 0]));

  async function record(type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER", amount: number, at: Date, from?: Types.ObjectId, to?: Types.ObjectId, description?: string) {
    if (from) {
      const b = bal.get(String(from))!;
      if (b - amount < taka(500)) return;
      bal.set(String(from), b - amount);
    }
    if (to) bal.set(String(to), bal.get(String(to))! + amount);
    const doc = new Transaction({
      txnId: generateTxnId(),
      type,
      fromAccount: from,
      toAccount: to,
      amount,
      fee: 0,
      status: "COMPLETED",
      description,
      initiatedBy: staff._id,
      balanceAfterFrom: from ? bal.get(String(from)) : undefined,
      balanceAfterTo: to ? bal.get(String(to)) : undefined,
      createdAt: at,
      updatedAt: at,
    });
    await doc.save({ timestamps: false });
  }

  const now = new Date();
  for (let m = 5; m >= 0; m--) {
    for (const acc of accounts) {
      const day = (d: number) => new Date(now.getFullYear(), now.getMonth() - m, Math.min(d, m === 0 ? now.getDate() : 28), rand(9, 18), rand(0, 59));
      await record("DEPOSIT", taka(rand(20, 60) * 1000), day(2), undefined, acc._id, "Salary / cash deposit");
      for (let i = 0; i < rand(2, 4); i++) {
        const target = accounts[rand(0, accounts.length - 1)];
        if (target._id.equals(acc._id)) continue;
        await record("TRANSFER", taka(rand(1, 8) * 1000), day(rand(5, 25)), acc._id, target._id, "Payment");
      }
      await record("WITHDRAWAL", taka(rand(2, 6) * 1000), day(rand(10, 27)), acc._id, undefined, "ATM withdrawal");
    }
  }
  for (const acc of accounts) await Account.updateOne({ _id: acc._id }, { $set: { balance: bal.get(String(acc._id)) } });

  await FundRequest.create({ account: accounts[0]._id, customer: rahim._id, type: "DEPOSIT", amount: taka(15000), description: "Cash deposit at branch", status: "PENDING" });
  await FundRequest.create({ account: accounts[2]._id, customer: karim._id, type: "WITHDRAWAL", amount: taka(5000), description: "Cash withdrawal", status: "PENDING" });

  const adminUser: AuthUser = { id: String(admin._id), role: "ADMIN", name: admin.name, email: admin.email };
  const approved = await applyForLoan(String(rahim._id), {
    accountId: String(accounts[0]._id), loanType: "PERSONAL", amount: taka(100000), durationMonths: 12,
    monthlyIncome: taka(60000), employmentStatus: "EMPLOYED", description: "Home renovation and furniture",
  });
  await decideLoan(adminUser, String(approved._id), "APPROVE", "Good income and history");

  await applyForLoan(String(karim._id), {
    accountId: String(accounts[3]._id), loanType: "BUSINESS", amount: taka(500000), durationMonths: 24,
    monthlyIncome: taka(150000), employmentStatus: "BUSINESS_OWNER", description: "Inventory expansion for retail shop",
  });

  console.log("\nSeed complete. Demo logins:");
  console.table([
    { role: "ADMIN", email: "admin@bank.test", password: "Admin@1234" },
    { role: "STAFF", email: "staff@bank.test", password: "Staff@1234" },
    { role: "CUSTOMER", email: "rahim@bank.test", password: "Customer@1234", pin: "1234" },
    { role: "CUSTOMER", email: "karim@bank.test", password: "Customer@1234", pin: "1234" },
  ]);
  console.log("Account numbers:", accounts.map((a) => `${a.type} ${a.accountNumber}`).join(" | "));
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
