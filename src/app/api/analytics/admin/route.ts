import { ok, route } from "@/server/utils/apiResponse";
import { requireRole } from "@/server/auth/guard";
import { adminOverview } from "@/server/services/analytics.service";

export const GET = route(async () => {
  await requireRole("ADMIN");
  return ok(await adminOverview());
});
