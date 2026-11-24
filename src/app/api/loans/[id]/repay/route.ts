import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { repaySchema } from "@/lib/validations/loan.schema";
import { repayLoan } from "@/server/services/loan.service";

export const POST = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("CUSTOMER");
  const { id } = await params;
  const { accountId, pin } = repaySchema.parse(await readJson(req));
  return ok(await repayLoan(user.id, id, accountId, pin));
});
