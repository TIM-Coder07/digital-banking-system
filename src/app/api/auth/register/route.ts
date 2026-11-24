import { type NextRequest } from "next/server";
import { ok, route, readJson } from "@/server/utils/apiResponse";
import { connectDB } from "@/server/db/connect";
import { registerCustomerSchema } from "@/lib/validations/auth.schema";
import { createCustomer } from "@/server/services/customer.service";

/** Public self registration. The customer stays unverified until staff verify them. */
export const POST = route(async (req: NextRequest) => {
  const data = registerCustomerSchema.parse(await readJson(req));
  await connectDB();
  return ok(await createCustomer(data, null), 201);
});
