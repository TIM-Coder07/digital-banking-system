"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetLoansQuery } from "@/store/features/loans/loanApi";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { label, type LoanStatus } from "@/lib/constants";
import { formatDay, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS: LoanStatus[] = ["PENDING", "UNDER_REVIEW", "ACTIVE", "COMPLETED", "REJECTED"];

/** Loan applications list. Shared by staff and admin. */
export function LoansTable({ basePath, defaultStatus = "PENDING" }: { basePath: string; defaultStatus?: LoanStatus }) {
  const [status, setStatus] = useState<LoanStatus>(defaultStatus);
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetLoansQuery({ status, page });

  return (
    <Card className="space-y-4">
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {TABS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition",
              status === s ? "bg-ink-900 text-white dark:bg-white dark:text-ink-900" : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300"
            )}
          >
            {label(s)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !data?.items.length ? (
        <EmptyState title={`No ${label(status).toLowerCase()} loans`} />
      ) : (
        <div className={isFetching ? "opacity-60" : ""}>
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-white/5">
                  <th className="px-5 py-3 font-medium">Applicant</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 text-right font-medium">Monthly income</th>
                  <th className="px-5 py-3 font-medium">Applied</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {data.items.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <Link href={`${basePath}/${l._id}`} className="font-medium hover:text-brand-600 hover:underline">
                        {typeof l.customer === "object" ? l.customer.name : "Open"}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{label(l.loanType)}</td>
                    <td className="num px-5 py-3 text-right font-semibold">{formatMoney(l.amount)}</td>
                    <td className="px-5 py-3 text-slate-500">{l.durationMonths} mo</td>
                    <td className="num px-5 py-3 text-right text-slate-500">{formatMoney(l.monthlyIncome)}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDay(l.createdAt)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
        </div>
      )}
    </Card>
  );
}