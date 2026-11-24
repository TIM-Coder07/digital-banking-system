"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, HandCoins, Send, Wallet } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAccount } from "@/store/features/accounts/accountSlice";
import { useGetAccountsQuery } from "@/store/features/accounts/accountApi";
import { useGetCustomerAnalyticsQuery } from "@/store/features/analytics/analyticsApi";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";
import { AccountSwitcher } from "@/components/dashboard/AccountSwitcher";
import { AccountCard } from "@/components/accounts/AccountCard";
import { MonthlyChart } from "@/components/charts/MonthlyChart";
import { DistributionChart } from "@/components/charts/DistributionChart";
import { TxnTable } from "@/components/transactions/TxnTable";
import { formatDay, formatMoney } from "@/lib/format";
import { label } from "@/lib/constants";

export default function CustomerDashboard() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const selected = useAppSelector((s) => s.account.selectedAccountId);
  const { data: accounts, isLoading: accLoading } = useGetAccountsQuery();
  const { data, isLoading } = useGetCustomerAnalyticsQuery(selected);

  const list = accounts?.items ?? [];
  const featured = list.find((a) => a._id === selected) ?? list[0];
  const t = data?.totals;

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.name.split(" ")[0] ?? ""}`}
        description="Here is what is happening with your money."
        actions={
          <Link href="/customer/transfer">
            <Button>
              <Send className="h-4 w-4" /> Send money
            </Button>
          </Link>
        }
      />

      <AccountSwitcher accounts={list} value={selected} onChange={(id) => dispatch(selectAccount(id))} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
        {accLoading ? <Skeleton className="h-52 rounded-2xl" /> : featured ? <AccountCard account={featured} /> : <EmptyState title="No accounts yet" description="Visit a branch to open your first account." />}
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label={selected ? "Account balance" : "Total balance"} value={t ? formatMoney(t.balance) : ""} icon={Wallet} tone="brand" loading={isLoading} />
          <StatCard label="Total deposits" value={t ? formatMoney(t.deposits) : ""} icon={ArrowDownLeft} tone="sky" loading={isLoading} />
          <StatCard label="Total withdrawals" value={t ? formatMoney(t.withdrawals) : ""} icon={ArrowUpRight} tone="rose" loading={isLoading} />
          <StatCard label="Active loans" value={data?.activeLoans.length ?? ""} icon={HandCoins} tone="amber" loading={isLoading} hint={data?.activeLoans[0] ? `Next EMI ${formatMoney(data.activeLoans[0].emiAmount)}` : undefined} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardTitle>Monthly spending and deposits</CardTitle>
          {isLoading ? <Skeleton className="h-72" /> : (
            <MonthlyChart
              data={(data?.monthly ?? []).slice(-6)}
              series={[
                { key: "spending", label: "Spending", color: "#e11d48" },
                { key: "deposits", label: "Deposits", color: "#059669" },
                { key: "received", label: "Received", color: "#0284c7" },
              ]}
            />
          )}
        </Card>
        <Card>
          <CardTitle>Transaction distribution</CardTitle>
          {isLoading ? <Skeleton className="h-44" /> : (
            <DistributionChart data={(data?.distribution ?? []).map((d) => ({ name: d.type, value: d.count }))} valueLabel="transactions" />
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardTitle action={<Link href="/customer/transactions" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>}>
            Recent transactions
          </CardTitle>
          {isLoading ? <Skeleton className="h-48" /> : data?.recent.length ? (
            <TxnTable items={data.recent} ownAccountIds={list.map((a) => a._id)} detailBase="/customer/transactions" />
          ) : (
            <EmptyState title="No transactions yet" />
          )}
        </Card>
        <Card>
          <CardTitle action={<Link href="/customer/loans" className="text-xs font-medium text-brand-600 hover:underline">Loans</Link>}>Active loans</CardTitle>
          {data?.activeLoans.length ? (
            <ul className="space-y-4">
              {data.activeLoans.map((l) => (
                  <li key={l._id}>
                    <Link href={`/customer/loans/${l._id}`} className="block rounded-xl border border-slate-100 p-4 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/[0.02]">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{label(l.loanType)} loan</span>
                        <span className="num text-slate-500">{formatMoney(l.remainingBalance)} left</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        EMI {formatMoney(l.emiAmount)}
                        {l.nextDue ? ` · due ${formatDay(l.nextDue)}` : ""}
                      </p>
                    </Link>
                  </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No active loans" action={<Link href="/customer/loans/apply" className="text-sm text-brand-600 hover:underline">Apply for a loan</Link>} />
          )}
        </Card>
      </div>
    </>
  );
}
