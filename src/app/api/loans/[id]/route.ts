import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { getLoanDetail } from "@/server/services/loan.service";

export const GET = route(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireAuth();
  const { id } = await params;
  return ok(await getLoanDetail(user, id));
});
