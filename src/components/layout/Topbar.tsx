"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Menu } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSidebarOpen } from "@/store/features/ui/uiSlice";
import { useGetNotificationsQuery } from "@/store/features/notifications/notificationApi";
import { ThemeToggle } from "./ThemeToggle";

export function Topbar() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const loading = useAppSelector((s) => s.ui.pendingCount > 0);
  const { data } = useGetNotificationsQuery(undefined, { skip: !user, pollingInterval: 30_000 });

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-white/5 dark:bg-ink-900/80">
      <div className={`h-0.5 bg-brand-500 transition-opacity ${loading ? "animate-pulse opacity-100" : "opacity-0"}`} />
      <div className="flex h-15 items-center gap-3 px-4 py-3 md:px-6 lg:px-8">
        <button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/5 lg:hidden" onClick={() => dispatch(setSidebarOpen(true))} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1" />
        <ThemeToggle />
        {user?.role === "CUSTOMER" && (
          <Link href="/customer/notifications" className="relative rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/5" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {!!data?.unread && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {data.unread > 9 ? "9+" : data.unread}
              </span>
            )}
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
