import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/options";
import { ROLE_HOME } from "@/lib/constants";

export default async function Home() {
  const session = await getServerSession(authOptions);
  redirect(session?.user ? ROLE_HOME[session.user.role] : "/login");
}
