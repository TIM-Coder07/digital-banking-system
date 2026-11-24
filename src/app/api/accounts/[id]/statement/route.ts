import { type NextRequest } from "next/server";
import { route } from "@/server/utils/apiResponse";
import { requireAuth } from "@/server/auth/guard";
import { getAccountForUser } from "@/server/services/account.service";
import { listTransactions } from "@/server/services/transaction.service";
import { Types } from "mongoose";

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** CSV statement: GET /api/accounts/:id/statement?from=2026-01-01&to=2026-11-30 */
export const GET = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireAuth();
  const { id } = await params;
  const account = await getAccountForUser(user, id); // ownership check
  const sp = req.nextUrl.searchParams;

  const { items } = await listTransactions(user, {
    accountId: id,
    from: sp.get("from"),
    to: sp.get("to"),
    skip: 0,
    limit: 5000,
  });

  const accId = new Types.ObjectId(id);
  const header = ["Date", "Reference", "Type", "Description", "Debit", "Credit", "Fee", "Balance After", "Status"];
  const lines = items.map((t) => {
    const from = t.fromAccount as unknown as { _id: Types.ObjectId } | undefined;
    const isDebit = !!from && accId.equals(from._id);
    const balance = isDebit ? t.balanceAfterFrom : t.balanceAfterTo;
    return [
      new Date(t.createdAt as unknown as string).toISOString(),
      t.txnId,
      t.type,
      t.description ?? "",
      isDebit ? (t.amount / 100).toFixed(2) : "",
      isDebit ? "" : (t.amount / 100).toFixed(2),
      isDebit ? (t.fee / 100).toFixed(2) : "0.00",
      balance != null ? (balance / 100).toFixed(2) : "",
      t.status,
    ]
      .map(csvCell)
      .join(",");
  });

  const csv = [header.join(","), ...lines].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="statement-${account.accountNumber}.csv"`,
    },
  });
});
