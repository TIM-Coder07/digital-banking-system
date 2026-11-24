import { ok, route } from "@/server/utils/apiResponse";
import { requireAuth } from "@/server/auth/guard";
import { listNotifications, markAllRead } from "@/server/services/notification.service";

export const GET = route(async () => {
  const user = await requireAuth();
  return ok(await listNotifications(user.id));
});

export const PATCH = route(async () => {
  const user = await requireAuth();
  await markAllRead(user.id);
  return ok({ updated: true });
});
