import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { registerCustomerSchema } from "@/lib/validations/auth.schema";
import { createCustomer, listCustomers } from "@/server/services/customer.service";

export const GET = route(async (req: NextRequest) => {
  await requireRole("STAFF", "ADMIN");
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = parsePaging(sp);
  const { items, total } = await listCustomers({ q: sp.get("q"), status: sp.get("status"), skip, limit });
  return ok(paginated(items, total, page, limit));
});

/** Staff registers a new customer at the branch. */
export const POST = route(async (req: NextRequest) => {
  const user = await requireRole("STAFF", "ADMIN");
  const data = registerCustomerSchema.parse(await readJson(req));
  return ok(await createCustomer(data, user.id), 201);
});
