import type { ScheduleItem } from "@/types";
import { formatDay, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/ui/Badge";

export function RepaymentSchedule({ schedule }: { schedule: ScheduleItem[] }) {
  const nextIdx = schedule.findIndex((s) => !s.paid);
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-white/5">
            <th className="px-5 py-2.5 font-medium">#</th>
            <th className="px-5 py-2.5 font-medium">Due date</th>
            <th className="px-5 py-2.5 text-right font-medium">Amount</th>
            <th className="px-5 py-2.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {schedule.map((s, i) => (
            <tr key={s.installmentNo} className={i === nextIdx ? "bg-brand-50/50 dark:bg-brand-500/5" : ""}>
              <td className="num px-5 py-2.5 text-slate-500">{s.installmentNo}</td>
              <td className="px-5 py-2.5">{formatDay(s.dueDate)}</td>
              <td className="num px-5 py-2.5 text-right font-medium">{formatMoney(s.amount)}</td>
              <td className="px-5 py-2.5">
                <StatusBadge status={s.paid ? "COMPLETED" : i === nextIdx ? "PENDING" : "INACTIVE"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
