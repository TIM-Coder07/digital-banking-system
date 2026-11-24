import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { loanNoteSchema } from "@/lib/validations/loan.schema";
import { addLoanNote } from "@/server/services/loan.service";

export const POST = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("STAFF", "ADMIN");
  const { id } = await params;
  const { note } = loanNoteSchema.parse(await readJson(req));
  return ok(await addLoanNote(user, id, note), 201);
});
