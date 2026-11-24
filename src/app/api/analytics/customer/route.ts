import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { customerOverview } from "@/server/services/analytics.service";

export const GET = route(async (req: NextRequest) => {
  const user = await requireRole("CUSTOMER");
  return ok(await customerOverview(user.id, req.nextUrl.searchParams.get("accountId")));
});
