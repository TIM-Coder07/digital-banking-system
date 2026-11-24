import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { reviewSchema } from "@/lib/validations/request.schema";
import { reviewFundRequest } from "@/server/services/request.service";

export const PATCH = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("STAFF", "ADMIN");
  const { id } = await params;
  const { decision, note } = reviewSchema.parse(await readJson(req));
  return ok(await reviewFundRequest(user, id, decision, note));
});
