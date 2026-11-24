import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { fundRequestSchema } from "@/lib/validations/request.schema";
import { createFundRequest, listFundRequests } from "@/server/services/request.service";
import { toPaisa } from "@/server/utils/money";

export const GET = route(async (req: NextRequest) => {
  const user = await requireAuth();
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = parsePaging(sp);
  const { items, total } = await listFundRequests(user, { status: sp.get("status"), type: sp.get("type"), skip, limit });
  return ok(paginated(items, total, page, limit));
});

export const POST = route(async (req: NextRequest) => {
  const user = await requireRole("CUSTOMER");
  const body = fundRequestSchema.parse(await readJson(req));
  const created = await createFundRequest(user.id, { ...body, amount: toPaisa(body.amount) });
  return ok(created, 201);
});
