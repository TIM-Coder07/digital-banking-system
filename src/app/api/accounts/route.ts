import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { createAccountSchema } from "@/lib/validations/account.schema";
import { createAccount, listAccounts } from "@/server/services/account.service";

export const GET = route(async (req: NextRequest) => {
  const user = await requireAuth();
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = parsePaging(sp, user.role === "CUSTOMER" ? 50 : 10);
  const { items, total } = await listAccounts(user, {
    q: sp.get("q"),
    status: sp.get("status"),
    type: sp.get("type"),
    ownerId: sp.get("ownerId"),
    skip,
    limit,
  });
  return ok(paginated(items, total, page, limit));
});

export const POST = route(async (req: NextRequest) => {
  const user = await requireRole("STAFF", "ADMIN");
  const data = createAccountSchema.parse(await readJson(req));
  return ok(await createAccount(user, data), 201);
});
