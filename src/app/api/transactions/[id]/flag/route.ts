import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { flagSchema } from "@/lib/validations/transfer.schema";
import { flagTransaction } from "@/server/services/transaction.service";

/** Staff flags for review, admin can flag or clear. */
export const PATCH = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("STAFF", "ADMIN");
  const { id } = await params;
  const { flagged, reason } = flagSchema.parse(await readJson(req));
  return ok(await flagTransaction(user, id, flagged, reason));
});
