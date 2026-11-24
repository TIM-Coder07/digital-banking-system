import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const tones = {
  brand: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300",
};

type Props = { label: string; value: string | number; icon: LucideIcon; hint?: string; tone?: keyof typeof tones; loading?: boolean };

export function StatCard({ label, value, icon: Icon, hint, tone = "slate", loading }: Props) {
  return (
    <Card className="flex items-start gap-4">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tones[tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-6 w-24" />
        ) : (
          <p className="num mt-1 truncate text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
        )}
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
    </Card>
  );
}
