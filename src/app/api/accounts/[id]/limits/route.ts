import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { accountLimitsSchema } from "@/lib/validations/account.schema";
import { setAccountLimits } from "@/server/services/account.service";
import { toPaisa } from "@/server/utils/money";

const conv = (v: number | null | undefined) => (v === undefined ? undefined : v === null ? null : toPaisa(v));

export const PATCH = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireRole("ADMIN");
  const { id } = await params;
  const body = accountLimitsSchema.parse(await readJson(req));
  const limits = Object.fromEntries(
    Object.entries({
      dailyTransferLimit: conv(body.dailyTransferLimit),
      singleTransactionLimit: conv(body.singleTransactionLimit),
      minimumBalance: conv(body.minimumBalance),
    }).filter(([, v]) => v !== undefined)
  );
  return ok(await setAccountLimits(id, limits));
});
