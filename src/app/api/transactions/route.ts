import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { listTransactions } from "@/server/services/transaction.service";

/** ?q=TXN...&type=TRANSFER&status=COMPLETED&from=2026-01-01&to=2026-02-01&accountId=&flagged=true&page=1 */
export const GET = route(async (req: NextRequest) => {
  const user = await requireAuth();
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = parsePaging(sp);
  const { items, total } = await listTransactions(user, {
    q: sp.get("q"),
    type: sp.get("type"),
    status: sp.get("status"),
    accountId: sp.get("accountId"),
    from: sp.get("from"),
    to: sp.get("to"),
    flagged: sp.get("flagged") === "true",
    skip,
    limit,
  });
  return ok(paginated(items, total, page, limit));
});
