"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useGetLoansQuery } from "@/store/features/loans/loanApi";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { label } from "@/lib/constants";
import { formatDay, formatMoney } from "@/lib/format";

export default function CustomerLoansPage() {
  const { data, isLoading } = useGetLoansQuery();
  const loans = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="My loans"
        description="Applications, active loans and repayments."
        actions={
          <Link href="/customer/loans/apply">
            <Button>
              <Plus className="h-4 w-4" /> Apply for a loan
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !loans.length ? (
        <EmptyState title="No loans yet" description="Apply for a personal, home, auto, education or business loan." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loans.map((l) => {
            const paid = l.totalPayable && l.remainingBalance != null ? 1 - l.remainingBalance / l.totalPayable : 0;
            return (
              <Link key={l._id} href={`/customer/loans/${l._id}`}>
                <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">{label(l.loanType)} loan</p>
                      <p className="num mt-1 text-2xl font-semibold">{formatMoney(l.amount)}</p>
                    </div>
                    <StatusBadge status={l.status} />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    {l.durationMonths} months · {l.interestRate}% p.a. · applied {formatDay(l.createdAt)}
                  </p>
                  {(l.status === "ACTIVE" || l.status === "COMPLETED") && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Repaid {Math.round(paid * 100)}%</span>
                        <span className="num">{formatMoney(l.remainingBalance ?? 0)} left</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${paid * 100}%` }} />
                      </div>
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}