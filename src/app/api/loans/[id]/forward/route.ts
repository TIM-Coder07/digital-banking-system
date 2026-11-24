import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { z } from "zod";
import { forwardLoan } from "@/server/services/loan.service";

const schema = z.object({ note: z.string().trim().max(1000).optional() });

export const PATCH = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("STAFF");
  const { id } = await params;
  const { note } = schema.parse(await readJson(req));
  return ok(await forwardLoan(user, id, note));
});
