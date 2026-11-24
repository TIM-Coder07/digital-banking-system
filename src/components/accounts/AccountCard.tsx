import type { Account } from "@/types";
import { label } from "@/lib/constants";
import { formatMoney, groupAccount } from "@/lib/format";
import { StatusBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const gradients: Record<string, string> = {
  SAVINGS: "from-emerald-600 via-emerald-700 to-ink-900",
  CURRENT: "from-sky-600 via-sky-800 to-ink-900",
  BUSINESS: "from-violet-600 via-violet-800 to-ink-900",
};

export function AccountCard({ account, className }: { account: Account; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg", gradients[account.type], className)}>
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-16 -right-4 h-40 w-40 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-white/70">{label(account.type)} account</p>
        <StatusBadge status={account.status} className="bg-white/10 text-white ring-white/20" />
      </div>
      <p className="num relative mt-6 text-3xl font-semibold tracking-tight">{formatMoney(account.balance)}</p>
      <p className="relative mt-1 text-xs text-white/60">Available balance</p>
      <p className="num relative mt-6 font-mono text-sm tracking-wider text-white/80">{groupAccount(account.accountNumber)}</p>
    </div>
  );
}
