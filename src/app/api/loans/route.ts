import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { applyLoanSchema } from "@/lib/validations/loan.schema";
import { applyForLoan, listLoans } from "@/server/services/loan.service";
import { toPaisa } from "@/server/utils/money";

export const GET = route(async (req: NextRequest) => {
  const user = await requireAuth();
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = parsePaging(sp);
  const { items, total } = await listLoans(user, { status: sp.get("status"), skip, limit });
  return ok(paginated(items, total, page, limit));
});

export const POST = route(async (req: NextRequest) => {
  const user = await requireRole("CUSTOMER");
  const body = applyLoanSchema.parse(await readJson(req));
  const loan = await applyForLoan(user.id, {
    ...body,
    amount: toPaisa(body.amount),
    monthlyIncome: toPaisa(body.monthlyIncome),
  });
  return ok(loan, 201);
});
