import { type NextRequest } from "next/server";
import { ok, route, readJson, parsePaging, paginated } from "@/server/utils/apiResponse";
import { requireAuth, requireRole } from "@/server/auth/guard";
import { transferSchema } from "@/lib/validations/transfer.schema";
import { transferFunds } from "@/server/services/transfer.service";
import { toPaisa } from "@/server/utils/money";
import { AppError } from "@/server/utils/errors";

export const POST = route(async (req: NextRequest) => {
  const user = await requireRole("CUSTOMER");

  const key = req.headers.get("idempotency-key");
  if (!key || key.length < 8 || key.length > 100) throw new AppError(400, "Missing Idempotency-Key header");

  const body = transferSchema.parse(await readJson(req));
  const result = await transferFunds({
    userId: user.id,
    fromAccountId: body.fromAccountId,
    toAccountNumber: body.toAccountNumber,
    amount: toPaisa(body.amount), // the server decides the paisa value
    description: body.description,
    pin: body.pin,
    idempotencyKey: key,
  });
  return ok(result.transaction, result.replayed ? 200 : 201);
});
