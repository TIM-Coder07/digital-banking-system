import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { ROLE_HOME, type Role } from "@/lib/constants";

/**
 * Page level guard. This only improves UX.
 * Real authorization happens in every API route via requireRole().
 */
const AREA_ROLES: Record<string, Role[]> = {
  "/admin": ["ADMIN"],
  "/staff": ["STAFF", "ADMIN"],
  "/customer": ["CUSTOMER"],
};

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;
    if (!role) return NextResponse.redirect(new URL("/login", req.url));

    const area = Object.keys(AREA_ROLES).find((p) => path === p || path.startsWith(`${p}/`));
    if (area && !AREA_ROLES[area].includes(role)) {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/unauthorized", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/customer/:path*"],
};
