import type { ClientSession, Types } from "mongoose";
import { Notification } from "@/server/models/Notification";
import type { NotificationType } from "@/lib/constants";

export type NotifyInput = {
  user: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
};

/** Pass the session so notifications commit or roll back with the money movement. */
export async function notify(items: NotifyInput[], session?: ClientSession) {
  if (!items.length) return;
  await Notification.create(items, { session, ordered: true });
}

export async function listNotifications(userId: string, limit = 20) {
  const [items, unread] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ user: userId, read: false }),
  ]);
  return { items, unread };
}

export async function markAllRead(userId: string) {
  await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
}
