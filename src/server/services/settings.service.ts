import type { ClientSession } from "mongoose";
import { BankSettings } from "@/server/models/BankSettings";

export async function getSettings(session?: ClientSession) {
  const existing = await BankSettings.findOne({ key: "global" }).session(session ?? null);
  if (existing) return existing;
  const created = await BankSettings.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: { key: "global" } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
  return created!;
}

export async function updateSettings(adminId: string, data: Record<string, number>) {
  await getSettings();
  return BankSettings.findOneAndUpdate({ key: "global" }, { $set: { ...data, updatedBy: adminId } }, { new: true });
}
