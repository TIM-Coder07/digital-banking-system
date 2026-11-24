import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { accountStatusSchema } from "@/lib/validations/account.schema";
import { setAccountStatus } from "@/server/services/account.service";

/** Admin only: freeze / unfreeze / close. */
export const PATCH = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireRole("ADMIN");
  const { id } = await params;
  const { status } = accountStatusSchema.parse(await readJson(req));
  return ok(await setAccountStatus(id, status));
});
