import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { connectDB } from "@/server/db/connect";
import { User } from "@/server/models/User";
import { AppError } from "@/server/utils/errors";
import type { Role } from "@/lib/constants";

export type AuthUser = { id: string; role: Role; name: string; email: string };

/**
 * Reads the session AND re-checks the user in the database, so a blocked or
 * deactivated user loses access immediately even with a valid JWT.
 */
export async function requireAuth(): Promise<AuthUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AppError(401, "Please sign in");

  await connectDB();
  const user = await User.findById(session.user.id).select("name email role status").lean();
  if (!user) throw new AppError(401, "User not found");
  if (user.status !== "ACTIVE") throw new AppError(403, "Your account is not active");

  return { id: String(user._id), role: user.role as Role, name: user.name, email: user.email };
}

export async function requireRole(...roles: Role[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) throw new AppError(403, "You do not have permission for this action");
  return user;
}

export const isStaffOrAdmin = (u: AuthUser) => u.role === "STAFF" || u.role === "ADMIN";
