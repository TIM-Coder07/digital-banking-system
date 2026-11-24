import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { customerStatusSchema } from "@/lib/validations/account.schema";
import { getCustomerDetail, setCustomerStatus } from "@/server/services/customer.service";

export const GET = route(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireRole("STAFF", "ADMIN");
  const { id } = await params;
  return ok(await getCustomerDetail(id));
});

/** Admin only: activate, deactivate or block. */
export const PATCH = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireRole("ADMIN");
  const { id } = await params;
  const { status } = customerStatusSchema.parse(await readJson(req));
  return ok(await setCustomerStatus(id, status));
});
