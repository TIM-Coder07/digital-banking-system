import { type NextRequest } from "next/server";
import { route } from "@/server/utils/apiResponse";
import { requireAuth } from "@/server/auth/guard";
import { getTransactionForUser } from "@/server/services/transaction.service";
import { buildReceiptPdf, type ReceiptData } from "@/server/services/receipt.service";

export const GET = route(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireAuth();
  const { id } = await params;
  const txn = await getTransactionForUser(user, id);
  const pdf = buildReceiptPdf(txn as unknown as ReceiptData);
  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="receipt-${txn.txnId}.pdf"`,
    },
  });
});
