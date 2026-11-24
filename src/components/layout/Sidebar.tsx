"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSidebarOpen } from "@/store/features/ui/uiSlice";
import { APP_NAME, ROLE_HOME, label } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";

export function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const open = useAppSelector((s) => s.ui.sidebarOpen);
  const items = user ? NAV[user.role] : [];
  const close = () => dispatch(setSidebarOpen(false));

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" onClick={close} aria-hidden />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink-900 text-slate-400 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href={user ? ROLE_HOME[user.role] : "/"} className="flex items-center gap-2.5 text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
              <Landmark className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight">{APP_NAME}</span>
          </Link>
          <button className="rounded p-1 hover:bg-white/5 lg:hidden" onClick={close} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const isHome = item.href === (user ? ROLE_HOME[user.role] : "");
            const active = isHome ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active ? "bg-white/[0.07] text-white" : "hover:bg-white/[0.04] hover:text-slate-200"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300")} />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="border-t border-white/5 p-4">
            <p className="truncate text-sm font-medium text-slate-200">{user.name}</p>
            <p className="text-xs text-slate-500">{label(user.role)}</p>
          </div>
        )}
      </aside>
    </>
  );
}
