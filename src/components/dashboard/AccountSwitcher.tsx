"use client";

import type { Account } from "@/types";
import { label } from "@/lib/constants";
import { maskAccount } from "@/lib/format";
import { cn } from "@/lib/utils";

/** "All accounts" + one pill per account. Selection lives in Redux (accountSlice). */
export function AccountSwitcher({ accounts, value, onChange }: { accounts: Account[]; value: string | null; onChange: (id: string | null) => void }) {
  if (accounts.length < 2) return null;
  const pill = (active: boolean) =>
    cn(
      "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition",
      active ? "bg-ink-900 text-white dark:bg-white dark:text-ink-900" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-ink-800 dark:text-slate-300 dark:ring-white/10"
    );
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <button className={pill(value === null)} onClick={() => onChange(null)}>
        All accounts
      </button>
      {accounts.map((a) => (
        <button key={a._id} className={pill(value === a._id)} onClick={() => onChange(a._id)}>
          {label(a.type)} {maskAccount(a.accountNumber)}
        </button>
      ))}
    </div>
  );
}
