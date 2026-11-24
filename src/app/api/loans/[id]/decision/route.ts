import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { loanDecisionSchema } from "@/lib/validations/loan.schema";
import { decideLoan } from "@/server/services/loan.service";

/** Admin only. Approval disburses the money in the same DB transaction. */
export const PATCH = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("ADMIN");
  const { id } = await params;
  const { decision, reason } = loanDecisionSchema.parse(await readJson(req));
  return ok(await decideLoan(user, id, decision, reason));
});
