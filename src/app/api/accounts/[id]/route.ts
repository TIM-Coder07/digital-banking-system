import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { updateAccountSchema } from "@/lib/validations/account.schema";
import { getAccountForUser, updateAccount } from "@/server/services/account.service";

export const GET = route(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireAuth();
  const { id } = await params;
  return ok(await getAccountForUser(user, id));
});

export const PATCH = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireRole("ADMIN");
  const { id } = await params;
  const data = updateAccountSchema.parse(await readJson(req));
  return ok(await updateAccount(id, data));
});
