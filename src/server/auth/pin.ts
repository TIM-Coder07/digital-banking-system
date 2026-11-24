import bcrypt from "bcryptjs";
import { User } from "@/server/models/User";
import { AppError } from "@/server/utils/errors";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export const hashPin = (pin: string) => bcrypt.hash(pin, 10);

export async function verifyPin(userId: string, pin: string) {
  const user = await User.findById(userId).select("+pinHash +pinAttempts +pinLockedUntil");
  if (!user?.pinHash) throw new AppError(400, "Set your transaction PIN in Settings first", "PIN_NOT_SET");

  if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
    throw new AppError(423, "Too many wrong PIN attempts. Try again in a few minutes.", "PIN_LOCKED");
  }

  const valid = await bcrypt.compare(pin, user.pinHash);
  if (!valid) {
    const attempts = (user.pinAttempts ?? 0) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      user.pinAttempts = 0;
      user.pinLockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
    } else {
      user.pinAttempts = attempts;
    }
    await user.save();
    throw new AppError(401, `Invalid transaction PIN (${MAX_ATTEMPTS - attempts > 0 ? MAX_ATTEMPTS - attempts : 0} tries left)`, "PIN_INVALID");
  }

  if (user.pinAttempts || user.pinLockedUntil) {
    user.pinAttempts = 0;
    user.pinLockedUntil = null;
    await user.save();
  }
}
