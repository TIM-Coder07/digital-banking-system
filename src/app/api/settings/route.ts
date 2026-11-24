import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { bankSettingsSchema } from "@/lib/validations/account.schema";
import { getSettings, updateSettings } from "@/server/services/settings.service";
import { toPaisa } from "@/server/utils/money";

export const GET = route(async () => {
  await requireRole("STAFF", "ADMIN");
  return ok(await getSettings());
});

/** Bank wide financial settings: admin only. */
export const PATCH = route(async (req: NextRequest) => {
  const user = await requireRole("ADMIN");
  const b = bankSettingsSchema.parse(await readJson(req));
  return ok(
    await updateSettings(user.id, {
      dailyTransferLimit: toPaisa(b.dailyTransferLimit),
      maxSingleTransaction: toPaisa(b.maxSingleTransaction),
      minimumBalance: toPaisa(b.minimumBalance),
      transferFeeBps: b.transferFeeBps,
      loanInterestRate: b.loanInterestRate,
      largeTransactionThreshold: toPaisa(b.largeTransactionThreshold),
      velocityLimit: b.velocityLimit,
    })
  );
});
