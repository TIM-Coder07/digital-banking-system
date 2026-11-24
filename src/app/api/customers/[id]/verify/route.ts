import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { verifyCustomer } from "@/server/services/customer.service";

export const PATCH = route(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("STAFF", "ADMIN");
  const { id } = await params;
  return ok(await verifyCustomer(id, user.id));
});
