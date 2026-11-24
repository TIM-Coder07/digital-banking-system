import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { setPinSchema } from "@/lib/validations/auth.schema";
import { setTransactionPin } from "@/server/services/customer.service";

export const POST = route(async (req: NextRequest) => {
  const user = await requireRole("CUSTOMER");
  const { pin, currentPassword } = setPinSchema.parse(await readJson(req));
  await setTransactionPin(user.id, pin, currentPassword);
  return ok({ updated: true });
});
